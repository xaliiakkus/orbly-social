"use client";

import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export type AutoSaveState = "idle" | "saving" | "saved" | "error";

export function AutoSaveStatus({
  state,
  error,
  className,
}: {
  state: AutoSaveState;
  error?: string;
  className?: string;
}) {
  if (state === "idle" && !error) return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-[13px] font-semibold shrink-0", className)}>
      {state === "saving" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          <span className="text-text-secondary">Kaydediliyor…</span>
        </>
      ) : null}
      {state === "saved" ? (
        <>
          <Check className="h-3.5 w-3.5 text-repost" />
          <span className="text-repost">Kaydedildi</span>
        </>
      ) : null}
      {state === "error" || error ? (
        <span className="text-like max-w-[200px] truncate">{error ?? "Kaydedilemedi"}</span>
      ) : null}
    </div>
  );
}
