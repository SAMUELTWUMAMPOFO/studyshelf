"use client";

import { Download, FileText, Presentation } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUploadDate, humanFileSize } from "@/lib/format";
import type { Material } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MaterialCardProps {
  material: Material;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const fileType = material.fileType.toLowerCase();
  const isPdf = fileType === "pdf";
  const isPresentation = fileType === "ppt" || fileType === "pptx";
  const TypeIcon = isPresentation ? Presentation : FileText;
  const fileMeta = [
    material.fileType.toUpperCase(),
    humanFileSize(material.fileSize),
    formatUploadDate(material.createdAt),
  ];

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Badge
          className={cn(
            "gap-1 border-transparent",
            isPdf && "bg-red-100 text-red-700",
            isPresentation && "bg-amber-100 text-amber-800",
            !isPdf && !isPresentation && "bg-slate-200 text-slate-700"
          )}
        >
          <TypeIcon className="h-3 w-3" aria-hidden />
          {material.fileType.toUpperCase()}
        </Badge>
        <span className="text-xs text-slate-500">{material.materialType}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-primary">
        {material.title}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge className="border-transparent bg-primary/10 text-primary">
          {material.courseCode}
        </Badge>
        <span className="text-sm text-slate-600">{material.courseName}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[`Level ${material.level}`, material.semester, material.programme].map(
          (chip) => (
            <span
              key={chip}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
            >
              {chip}
            </span>
          )
        )}
      </div>

      {material.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {material.description}
        </p>
      )}
      {material.lecturer && (
        <p className="mt-2 text-xs text-slate-500">
          Lecturer: {material.lecturer}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          {fileMeta.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 && <span aria-hidden> · </span>}
              {item}
            </span>
          ))}
          <span aria-hidden> · </span>
          <span className="inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5" aria-hidden />
            {material.downloads}
          </span>
        </p>
        <Button
          asChild
          className="h-11 w-full gap-2 sm:h-10 sm:w-auto"
        >
          <a href={`/api/materials/${material.id}/download`} download>
            <Download className="h-4 w-4" aria-hidden />
            Download
          </a>
        </Button>
      </div>
    </article>
  );
}
