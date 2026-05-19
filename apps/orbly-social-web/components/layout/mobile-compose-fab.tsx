"use client";

import { PenLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileComposeSheet } from "@/components/layout/mobile-compose-sheet";
import { cn } from "@/lib/cn";

const HIDDEN_PREFIXES = ["/settings", "/live/"];

export function MobileComposeFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hidden =
    HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p)) ||
    /^\/live\/[^/]+/.test(pathname ?? "");

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Gönderi oluştur"
        onClick={() => setOpen(true)}
        className={cn(
          "md:hidden fixed z-40 flex h-[56px] w-[56px] items-center justify-center",
          "rounded-full bg-accent text-white shadow-lg shadow-accent/35",
          "hover:bg-accent-hover active:scale-95 transition-transform",
          "right-4 bottom-[calc(53px+env(safe-area-inset-bottom)+12px)]",
        )}
      >
        <PenLine className="h-6 w-6" strokeWidth={2.25} />
      </button>
      <MobileComposeSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
