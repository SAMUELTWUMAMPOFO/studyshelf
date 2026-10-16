"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenAdmin: () => void;
}

export function Header({ onOpenAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col justify-center">
            <span className="text-base font-bold leading-tight text-primary">StudyShelf</span>
            <span className="hidden text-xs leading-tight text-slate-500 sm:block">
              study materials
            </span>
          </span>
        </Link>
        <Button
          variant="outline"
          onClick={onOpenAdmin}
          className="h-11 gap-2 sm:h-9"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Admin
        </Button>
      </div>
    </header>
  );
}
