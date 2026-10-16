"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_FILTERS,
  fetchAdminStatus,
  fetchMaterials,
  hasActiveFilters,
  type MaterialFilters,
} from "./api";
import { AdminModal } from "./admin-modal";
import { Footer } from "./footer";
import { Header } from "./header";
import { Hero } from "./hero";
import { MaterialsGrid } from "./materials-grid";
import { SearchFilters } from "./search-filters";

export function StudyShelfPage() {
  const [filters, setFilters] = useState<MaterialFilters>(DEFAULT_FILTERS);
  const [adminOpen, setAdminOpen] = useState(false);
  const queryClient = useQueryClient();

  const materialsQuery = useQuery({
    queryKey: ["materials", filters],
    queryFn: () => fetchMaterials(filters),
    placeholderData: keepPreviousData,
  });

  const adminStatusQuery = useQuery({
    queryKey: ["admin-status"],
    queryFn: fetchAdminStatus,
    enabled: adminOpen,
  });

  const handleFilterChange = useCallback((update: Partial<MaterialFilters>) => {
    setFilters((previous) => ({ ...previous, ...update }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const refreshAdminStatus = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
  }, [queryClient]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header onOpenAdmin={() => setAdminOpen(true)} />

      <main className="flex-1">
        <Hero stats={materialsQuery.data?.stats} />

        <SearchFilters
          filters={filters}
          courses={materialsQuery.data?.courses ?? []}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <MaterialsGrid
            materials={materialsQuery.data?.materials ?? []}
            isPending={materialsQuery.isPending}
            isError={materialsQuery.isError}
            hasFilters={hasActiveFilters(filters)}
            onRetry={() => void materialsQuery.refetch()}
          />
        </section>
      </main>

      <Footer />

      <AdminModal
        open={adminOpen}
        onOpenChange={setAdminOpen}
        status={adminStatusQuery.data}
        statusLoading={adminStatusQuery.isPending}
        onStatusRefresh={refreshAdminStatus}
      />
    </div>
  );
}
