"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS, MATERIAL_TYPES, PROGRAMMES, SEMESTERS } from "@/lib/constants";
import type { CourseFacet } from "@/lib/types";

import { hasActiveFilters, type MaterialFilters } from "./api";

interface SearchFiltersProps {
  filters: MaterialFilters;
  courses: CourseFacet[];
  onChange: (update: Partial<MaterialFilters>) => void;
  onClear: () => void;
}

interface FilterSelectProps {
  ariaLabel: string;
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({
  ariaLabel,
  value,
  allLabel,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} className="h-11! w-full bg-white">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SearchFilters({
  filters,
  courses,
  onChange,
  onClear,
}: SearchFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search updates (300ms) before they hit the API.
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      onChange({ search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onChange]);

  // Clear the local input immediately; onClear resets the committed filter.
  const handleClear = () => {
    setSearchInput("");
    onClear();
  };

  const active = hasActiveFilters(filters);

  return (
    <section
      aria-label="Search and filter materials"
      className="border-y border-slate-200 bg-slate-50/70 py-4"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title, course, code or keyword..."
            aria-label="Search materials"
            className="h-11 bg-white pl-9"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            ariaLabel="Filter by programme"
            value={filters.programme}
            allLabel="All programmes"
            options={PROGRAMMES.map((programme) => ({
              value: programme,
              label: programme,
            }))}
            onChange={(value) => onChange({ programme: value })}
          />
          <FilterSelect
            ariaLabel="Filter by level"
            value={filters.level}
            allLabel="All levels"
            options={LEVELS.map((level) => ({
              value: level,
              label: `Level ${level}`,
            }))}
            onChange={(value) => onChange({ level: value })}
          />
          <FilterSelect
            ariaLabel="Filter by semester"
            value={filters.semester}
            allLabel="All semesters"
            options={SEMESTERS.map((semester) => ({
              value: semester,
              label: semester,
            }))}
            onChange={(value) => onChange({ semester: value })}
          />
          <FilterSelect
            ariaLabel="Filter by course"
            value={filters.course}
            allLabel="All courses"
            options={courses.map((course) => ({
              value: course.courseCode,
              label: `${course.courseCode} · ${course.courseName}`,
            }))}
            onChange={(value) => onChange({ course: value })}
          />
          <FilterSelect
            ariaLabel="Filter by material type"
            value={filters.type}
            allLabel="All types"
            options={MATERIAL_TYPES.map((type) => ({ value: type, label: type }))}
            onChange={(value) => onChange({ type: value })}
          />
          {active && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="h-11 gap-2 text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
