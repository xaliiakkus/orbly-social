"use client";

import { Search } from "lucide-react";

import { SETTINGS_NAV, type SettingsSectionId } from "@/components/settings/settings-config";
import { cn } from "@/lib/cn";

export function SettingsNav({
  active,
  onSelect,
  query,
  onQueryChange,
}: {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? SETTINGS_NAV.filter((item) => item.label.toLowerCase().includes(q))
    : SETTINGS_NAV;

  return (
    <aside className="w-full md:w-[350px] shrink-0 md:border-r border-border flex flex-col min-h-0">
      <div className="px-4 py-3">
        <h1 className="text-[20px] font-extrabold leading-7">Ayarlar</h1>
      </div>

      <div className="px-4 pb-3">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Ayarlarda Ara"
            className="w-full bg-bg-secondary rounded-full pl-11 pr-4 py-2.5 text-[15px] outline-none border border-transparent focus:border-accent/50 placeholder:text-text-secondary"
          />
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide" aria-label="Ayarlar menüsü">
        {filtered.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "relative w-full flex items-center justify-between px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-bg-hover",
                isActive && "bg-bg-hover font-bold",
                !item.available && !isActive && "text-text-secondary",
              )}
            >
              <span>{item.label}</span>
              {isActive && (
                <span
                  className="absolute right-0 top-0 bottom-0 w-1 bg-accent"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-text-secondary text-[15px]">Sonuç bulunamadı.</p>
        )}
      </nav>
    </aside>
  );
}
