"use client";

import { cn } from "@/lib/cn";

export type ExploreTabId = "for-you" | "trending" | "news" | "sports" | "fun";

export const EXPLORE_TABS: { id: ExploreTabId; label: string }[] = [
  { id: "for-you", label: "Sana Özel" },
  { id: "trending", label: "Gündemdekiler" },
  { id: "news", label: "Haberler" },
  { id: "sports", label: "Spor" },
  { id: "fun", label: "Eğlence" },
];

export function ExploreScrollTabs({
  active,
  onChange,
}: {
  active: ExploreTabId;
  onChange: (id: ExploreTabId) => void;
}) {
  return (
    <div className="border-b border-border overflow-x-auto scrollbar-none">
      <div className="flex min-w-max px-2">
        {EXPLORE_TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(t.id)}
              className={cn(
                "relative px-3.5 py-3.5 text-[15px] font-semibold whitespace-nowrap transition-colors",
                selected ? "text-text-primary font-bold" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {t.label}
              {selected ? (
                <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
