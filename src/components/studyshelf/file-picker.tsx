"use client";

import { useRef, type ChangeEvent } from "react";
import { FileText, FileUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { humanFileSize } from "@/lib/format";

interface FilePickerProps {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Dashed drop-zone style picker for a single PDF / PPT / PPTX file.
 * Validation is handled by the parent through onSelect.
 */
export function FilePicker({
  file,
  onSelect,
  onClear,
  disabled = false,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) onSelect(selected);
    // Reset so picking the same file again re-triggers onChange.
    event.target.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">{humanFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Remove selected file"
            onClick={onClear}
            disabled={disabled}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-20 w-full flex-col gap-1.5 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-primary/40 hover:bg-slate-100 hover:text-primary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <FileUp className="h-5 w-5" aria-hidden />
          Choose PDF, PPT or PPTX file
        </Button>
      )}
    </div>
  );
}
