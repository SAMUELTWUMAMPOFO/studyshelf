"use client";

import {
  AlertCircle,
  BookOpen,
  SearchX,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Material } from "@/lib/types";

import { MaterialCard } from "./material-card";

interface MaterialsGridProps {
  materials: Material[];
  isPending: boolean;
  isError: boolean;
  hasFilters: boolean;
  onRetry: () => void;
}

function MaterialCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function MaterialsGrid({
  materials,
  isPending,
  isError,
  hasFilters,
  onRetry,
}: MaterialsGridProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <MaterialCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
        <h3 className="mt-3 font-semibold text-slate-900">
          Couldn&apos;t load materials
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Check your connection and try again.
        </p>
        <Button
          variant="outline"
          className="mt-5 h-11"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (materials.length === 0) {
    return hasFilters ? (
      <EmptyState
        icon={SearchX}
        title="No matching materials"
        description="Try a different search or clear the filters."
      />
    ) : (
      <EmptyState
        icon={BookOpen}
        title="The library is empty"
        description="Uploaded materials will appear here automatically."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}
