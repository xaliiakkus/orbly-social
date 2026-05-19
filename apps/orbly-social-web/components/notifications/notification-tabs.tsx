"use client";

import type { NotificationTabId } from "@orbly/features";
import { NOTIFICATION_TABS } from "@orbly/features";

import { cn } from "@/lib/cn";

export function NotificationTabs({
  active,
  onChange,
}: {
  active: NotificationTabId;
  onChange: (tab: NotificationTabId) => void;
}) {
  return (
    <div className="flex border-b border-border bg-bg-primary">
      {NOTIFICATION_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative flex-1 py-3.5 text-[15px] font-semibold transition-colors hover:bg-bg-hover"
          >
            <span className={cn(selected ? "text-text-primary font-bold" : "text-text-secondary")}>
              {tab.label}
            </span>
            {selected ? (
              <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
