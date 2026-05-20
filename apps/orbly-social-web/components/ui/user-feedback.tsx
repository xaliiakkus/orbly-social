"use client";

import { cn } from "@/lib/cn";

export function UserFeedbackBanner({
  message,
  variant = "error",
  onDismiss,
}: {
  message: string;
  variant?: "success" | "error";
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mx-4 mb-3 rounded-xl border px-4 py-3 text-[15px] leading-snug",
        variant === "success"
          ? "border-accent/30 bg-accent/10 text-text-primary"
          : "border-red-500/30 bg-red-500/10 text-text-primary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        {onDismiss ? (
          <button
            type="button"
            className="shrink-0 text-text-secondary hover:text-text-primary text-sm font-semibold"
            onClick={onDismiss}
            aria-label="Kapat"
          >
            Kapat
          </button>
        ) : null}
      </div>
    </div>
  );
}
