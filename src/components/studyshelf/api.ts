// Client-side data access for StudyShelf. All fetches use relative paths.

import type { QueryClient } from "@tanstack/react-query";

import type { AdminStatus, MaterialsResponse } from "@/lib/types";

// Shared filter state for the public library. "all" means the filter is not applied.
export interface MaterialFilters {
  search: string;
  programme: string;
  level: string;
  semester: string;
  course: string;
  type: string;
}

export const DEFAULT_FILTERS: MaterialFilters = {
  search: "",
  programme: "all",
  level: "all",
  semester: "all",
  course: "all",
  type: "all",
};

export function hasActiveFilters(filters: MaterialFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.programme !== "all" ||
    filters.level !== "all" ||
    filters.semester !== "all" ||
    filters.course !== "all" ||
    filters.type !== "all"
  );
}

export function buildMaterialsUrl(filters: MaterialFilters): string {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search) params.set("search", search);
  if (filters.programme !== "all") params.set("programme", filters.programme);
  if (filters.level !== "all") params.set("level", filters.level);
  if (filters.semester !== "all") params.set("semester", filters.semester);
  if (filters.course !== "all") params.set("course", filters.course);
  if (filters.type !== "all") params.set("type", filters.type);
  const queryString = params.toString();
  return queryString ? `/api/materials?${queryString}` : "/api/materials";
}

// Every API error uses the shape { error: "message" }.
async function parseErrorResponse(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}

export async function fetchMaterials(
  filters: MaterialFilters
): Promise<MaterialsResponse> {
  const res = await fetch(buildMaterialsUrl(filters));
  if (!res.ok) throw await parseErrorResponse(res, "Failed to load materials.");
  return (await res.json()) as MaterialsResponse;
}

export async function fetchAdminStatus(): Promise<AdminStatus> {
  const res = await fetch("/api/admin/status");
  if (!res.ok) throw await parseErrorResponse(res, "Failed to load admin status.");
  return (await res.json()) as AdminStatus;
}

// Refresh the public library and the admin manage list after uploads / edits / deletes.
export function invalidateMaterialQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["materials"] });
  void queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
}
