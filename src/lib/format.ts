// Small formatting / validation helpers shared by the StudyShelf UI.

import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/constants";

/**
 * Human readable file size: B / KB / MB / GB (1 decimal, whole bytes).
 */
export function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * "12 Jan 2025" style date for upload timestamps (en-GB).
 */
export function formatUploadDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Client-side file validation for uploads. Returns an error message, or null when valid.
 */
export function validateMaterialFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isAccepted = ACCEPTED_FILE_TYPES.some((type) => type.ext === extension);
  if (!isAccepted) {
    return "Unsupported file type. Please choose a PDF, PPT or PPTX file.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is larger than ${MAX_FILE_SIZE_MB} MB`;
  }
  return null;
}
