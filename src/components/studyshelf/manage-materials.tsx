"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEVELS } from "@/lib/constants";
import { humanFileSize, validateMaterialFile } from "@/lib/format";
import { adminFetch, clearSessionToken } from "@/lib/session";
import type { Material } from "@/lib/types";

import { DEFAULT_FILTERS, fetchMaterials, invalidateMaterialQueries } from "./api";
import { FilePicker } from "./file-picker";
import {
  EMPTY_MATERIAL_FORM,
  MaterialFormFields,
  type MaterialFormValues,
} from "./material-form-fields";

function toFormValues(material: Material): MaterialFormValues {
  return {
    title: material.title,
    courseName: material.courseName,
    courseCode: material.courseCode,
    programme: material.programme,
    level: material.level,
    semester: material.semester,
    materialType: material.materialType,
    lecturer: material.lecturer ?? "",
    description: material.description ?? "",
  };
}

export function ManageMaterials() {
  const queryClient = useQueryClient();
  const [activeLevel, setActiveLevel] = useState("all");

  const [editing, setEditing] = useState<Material | null>(null);
  const [editForm, setEditForm] = useState<MaterialFormValues>(EMPTY_MATERIAL_FORM);
  const [editPending, setEditPending] = useState(false);

  const [replacing, setReplacing] = useState<Material | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePending, setReplacePending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const materialsQuery = useQuery({
    queryKey: ["admin-materials", activeLevel],
    queryFn: () => fetchMaterials({ ...DEFAULT_FILTERS, level: activeLevel }),
  });

  const materials = materialsQuery.data?.materials ?? [];

  const openEdit = (material: Material) => {
    setEditing(material);
    setEditForm(toFormValues(material));
  };

  const openReplace = (material: Material) => {
    setReplacing(material);
    setReplaceFile(null);
  };

  const closeEdit = () => {
    if (!editPending) setEditing(null);
  };

  const closeReplace = () => {
    if (!replacePending) {
      setReplacing(null);
      setReplaceFile(null);
    }
  };

  const handleSelectReplaceFile = (selected: File) => {
    const validationError = validateMaterialFile(selected);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setReplaceFile(selected);
  };

  const handleSaveEdit = async () => {
    if (!editing || editPending) return;
    if (!editForm.title.trim() || !editForm.courseName.trim() || !editForm.courseCode.trim()) {
      toast.error("Please fill in the title, course name and course code.");
      return;
    }
    if (!editForm.level || !editForm.programme || !editForm.semester || !editForm.materialType) {
      toast.error("Please select the level, programme, semester and material type.");
      return;
    }

    setEditPending(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title.trim());
      formData.append("courseName", editForm.courseName.trim());
      formData.append("courseCode", editForm.courseCode.trim());
      formData.append("programme", editForm.programme);
      formData.append("level", editForm.level);
      formData.append("semester", editForm.semester);
      formData.append("materialType", editForm.materialType);
      formData.append("lecturer", editForm.lecturer.trim());
      formData.append("description", editForm.description.trim());

      const res = await adminFetch(`/api/admin/materials/${editing.id}`, {
        method: "PATCH",
        body: formData,
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (res.status === 401) {
          clearSessionToken();
          void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
          toast.error("Your session has expired — please sign in again.");
        } else {
          toast.error(body?.error ?? "Could not save changes.");
        }
        return;
      }
      toast.success("Changes saved.");
      invalidateMaterialQueries(queryClient);
      setEditing(null);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setEditPending(false);
    }
  };

  const handleReplace = async () => {
    if (!replacing || !replaceFile || replacePending) return;

    setReplacePending(true);
    try {
      const formData = new FormData();
      formData.append("file", replaceFile);

      const res = await adminFetch(`/api/admin/materials/${replacing.id}`, {
        method: "PATCH",
        body: formData,
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (res.status === 401) {
          clearSessionToken();
          void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
          toast.error("Your session has expired — please sign in again.");
        } else {
          toast.error(body?.error ?? "Could not replace the file.");
        }
        return;
      }
      toast.success("File replaced.");
      invalidateMaterialQueries(queryClient);
      setReplacing(null);
      setReplaceFile(null);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setReplacePending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deletePending) return;

    setDeletePending(true);
    try {
      const res = await adminFetch(`/api/admin/materials/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        if (res.status === 401) {
          clearSessionToken();
          void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
          toast.error("Your session has expired — please sign in again.");
        } else {
          toast.error(body?.error ?? "Could not delete the material.");
        }
        return;
      }
      toast.success("Material deleted from the library.");
      invalidateMaterialQueries(queryClient);
      setDeleteTarget(null);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeLevel} onValueChange={setActiveLevel}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {LEVELS.map((level) => (
            <TabsTrigger key={level} value={level}>
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {materialsQuery.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-[70px] w-full rounded-lg" />
          <Skeleton className="h-[70px] w-full rounded-lg" />
          <Skeleton className="h-[70px] w-full rounded-lg" />
        </div>
      ) : materialsQuery.isError ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <AlertCircle className="mx-auto h-5 w-5 text-destructive" aria-hidden />
          <p className="mt-2 text-sm text-slate-600">
            {materialsQuery.error instanceof Error
              ? materialsQuery.error.message
              : "Couldn't load materials."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-9"
            onClick={() => void materialsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : materials.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No materials {activeLevel === "all" ? "in the library yet" : `in level ${activeLevel} yet`}.
        </p>
      ) : (
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{material.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {material.courseCode} · {material.level} · {material.semester} ·{" "}
                  {humanFileSize(material.fileSize)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Edit ${material.title}`}
                  onClick={() => openEdit(material)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Replace file for ${material.title}`}
                  onClick={() => openReplace(material)}
                >
                  <FileUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-red-50 hover:text-destructive"
                  aria-label={`Delete ${material.title}`}
                  onClick={() => setDeleteTarget(material)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit details dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit material</DialogTitle>
            <DialogDescription>
              Update the details for “{editing?.title}”.
            </DialogDescription>
          </DialogHeader>
          <MaterialFormFields
            values={editForm}
            onChange={(update) =>
              setEditForm((previous) => ({ ...previous, ...update }))
            }
            disabled={editPending}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={editPending}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={editPending}
              className="gap-2"
            >
              {editPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace file dialog */}
      <Dialog
        open={replacing !== null}
        onOpenChange={(open) => {
          if (!open) closeReplace();
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Replace file</DialogTitle>
            <DialogDescription>
              Upload a new PDF, PPT or PPTX file for “{replacing?.title}”.
            </DialogDescription>
          </DialogHeader>
          {replacing && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current file
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {replacing.fileType.toUpperCase()} · {humanFileSize(replacing.fileSize)}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              New file <span className="text-destructive">*</span>
            </p>
            <FilePicker
              file={replaceFile}
              onSelect={handleSelectReplaceFile}
              onClear={() => setReplaceFile(null)}
              disabled={replacePending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReplace} disabled={replacePending}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleReplace()}
              disabled={replacePending || !replaceFile}
              className="gap-2"
            >
              {replacePending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileUp className="h-4 w-4" aria-hidden />
              )}
              Replace file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file from the library. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deletePending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
