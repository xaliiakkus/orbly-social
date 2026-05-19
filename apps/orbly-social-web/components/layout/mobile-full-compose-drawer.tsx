"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useVisualViewportRect } from "@/lib/use-visual-viewport-rect";
import { cn } from "@/lib/cn";

/** X mobil: tam ekran compose — görünür viewport kadar yükseklik (klavye alanı boş kalır). */
export function MobileFullComposeDrawer({
  open,
  onClose,
  onSubmit,
  canSubmit,
  isSubmitting,
  submitLabel = "Gönder",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const { top, height } = useVisualViewportRect();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[80] flex flex-col bg-bg-primary md:hidden"
      style={{ top, height }}
      role="dialog"
      aria-modal="true"
    >
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 px-4 py-3",
          "pt-[max(0.75rem,env(safe-area-inset-top))]",
          "border-b border-border",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="text-[17px] text-text-primary hover:opacity-80"
        >
          İptal et
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={cn(
            "rounded-full px-5 py-1.5 text-[15px] font-bold transition-colors",
            canSubmit && !isSubmitting
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-accent/35 text-white/80 cursor-not-allowed",
          )}
        >
          {isSubmitting ? "…" : submitLabel}
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>,
    document.body,
  );
}
