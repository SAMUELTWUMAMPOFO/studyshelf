"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import { validateMaterialFile } from "@/lib/format";

import { invalidateMaterialQueries } from "./api";
import { FilePicker } from "./file-picker";
import {
  EMPTY_MATERIAL_FORM,
  MaterialFormFields,
  type MaterialFormValues,
} from "./material-form-fields";

// XMLHttpRequest (not fetch) so we get real upload progress events.
function uploadWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/materials");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.response });
    xhr.onerror = () => reject(new Error("network-error"));
    xhr.send(formData);
  });
}

export function UploadMaterialForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaterialFormValues>(EMPTY_MATERIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleSelectFile = (selected: File) => {
    const validationError = validateMaterialFile(selected);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading) return;

    if (!file) {
      toast.error("Please choose a PDF, PPT or PPTX file.");
      return;
    }
    const validationError = validateMaterialFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!form.level) {
      toast.error("Please select a level.");
      return;
    }
    if (!form.title.trim() || !form.courseName.trim() || !form.courseCode.trim()) {
      toast.error("Please fill in the title, course name and course code.");
      return;
    }
    if (!form.programme || !form.semester || !form.materialType) {
      toast.error("Please select the programme, semester and material type.");
      return;
    }

    const title = form.title.trim();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("courseName", form.courseName.trim());
    formData.append("courseCode", form.courseCode.trim());
    formData.append("programme", form.programme);
    formData.append("level", form.level);
    formData.append("semester", form.semester);
    formData.append("materialType", form.materialType);
    if (form.lecturer.trim()) formData.append("lecturer", form.lecturer.trim());
    if (form.description.trim()) {
      formData.append("description", form.description.trim());
    }

    setUploading(true);
    setProgress(0);
    try {
      const { status, body } = await uploadWithProgress(formData, setProgress);
      if (status === 201) {
        toast.success(`${title} published to the library.`);
        // Reset the form but keep the selected level for consecutive uploads.
        setForm((previous) => ({ ...EMPTY_MATERIAL_FORM, level: previous.level }));
        setFile(null);
        setProgress(0);
        invalidateMaterialQueries(queryClient);
      } else {
        const errorBody = body as { error?: string } | null;
        toast.error(errorBody?.error ?? "Upload failed. Please try again.");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          File <span className="text-destructive">*</span>
        </p>
        <FilePicker
          file={file}
          onSelect={handleSelectFile}
          onClear={() => setFile(null)}
          disabled={uploading}
        />
        <p className="text-xs text-slate-500">
          PDF, PPT or PPTX up to {MAX_FILE_SIZE_MB} MB.
        </p>
      </div>

      <MaterialFormFields
        values={form}
        onChange={(update) =>
          setForm((previous) => ({ ...previous, ...update }))
        }
        disabled={uploading}
      />

      {uploading && (
        <div className="space-y-1.5">
          <Progress value={progress} />
          <p className="text-xs text-slate-500">Uploading… {progress}%</p>
        </div>
      )}

      <Button
        type="submit"
        className="h-12 w-full gap-2 text-base"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-5 w-5" aria-hidden />
        )}
        {uploading ? "Uploading…" : "Upload & publish"}
      </Button>
    </form>
  );
}
