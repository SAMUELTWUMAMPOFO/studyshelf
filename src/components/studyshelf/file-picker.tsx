"use client";

import { useId, type ChangeEvent } from "react";
import { FileText, FileUp, X } from "lucide-react";

import { humanFileSize } from "@/lib/format";

interface FilePickerProps {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Dashed drop-zone style picker for a single PDF / PPT / PPTX file.
 *
 * Uses a native <label> bound to a visually-hidden (but rendered) file input
 * instead of a display:none input + programmatic click(). Programmatic clicks
 * on hidden inputs are unreliable on mobile browsers (notably iOS Safari) —
 * the native label always opens the device file picker / Files app.
 * Validation is handled by the parent through onSelect.
 */
export function FilePicker({
  file,
  onSelect,
  onClear,
  disabled = false,
}: FilePickerProps) {
  const inputId = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) onSelect(selected);
    // Reset so picking the same file again re-triggers onChange.
    event.target.value = "";
  };

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="sr-only"
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
          <div className="flex shrink-0 items-center gap-1">
            <label
              htmlFor={inputId}
              className="inline-flex h-9 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-primary hover:bg-slate-100"
            >
              Change
            </label>
            <button
              type="button"
              aria-label="Remove selected file"
              onClick={(event) => {
                event.preventDefault();
                onClear();
              }}
              disabled={disabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 transition-colors hover:border-primary/40 hover:bg-slate-100 hover:text-primary"
        >
          <FileUp className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium">Choose PDF, PPT or PPTX file</span>
        </label>
      )}
    </div>
  );
}
