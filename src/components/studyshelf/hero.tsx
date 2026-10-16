"use client";

import { BookOpen, Download, type LucideIcon } from "lucide-react";

interface HeroStats {
  materials: number;
  downloads: number;
}

interface HeroProps {
  stats?: HeroStats;
}

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <span className="font-semibold text-primary">{value}</span>
      {label}
    </span>
  );
}

export function Hero({ stats }: HeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
        Free lecture slides &amp; study materials
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
        Welcome to StudyShelf. Browse, search and download lecture slides and
        study materials shared by lecturers — no account needed, free for every
        student.
      </p>
      {stats && (
        <div className="mt-6 flex flex-wrap gap-2.5">
          <StatChip icon={BookOpen} value={stats.materials} label="materials" />
          <StatChip icon={Download} value={stats.downloads} label="downloads" />
        </div>
      )}
    </section>
  );
}
