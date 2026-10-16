"use client";

import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-primary pb-[env(safe-area-inset-bottom)] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <GraduationCap className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">StudyShelf</p>
            <p className="text-xs text-white/70">
              Free lecture slides and study materials for every student.
            </p>
          </div>
        </div>
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} StudyShelf
        </p>
      </div>
    </footer>
  );
}
