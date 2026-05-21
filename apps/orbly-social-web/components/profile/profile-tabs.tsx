"use client";

import { cn } from "@/lib/cn";

export type ProfileTab =
  | "posts"
  | "broadcasts"
  | "replies"
  | "orbits"
  | "highlights"
  | "articles"
  | "media"
  | "likes";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Gönderiler" },
  { id: "broadcasts", label: "Yayınlar" },
  { id: "replies", label: "Yanıtlar" },
  { id: "media", label: "Medya" },
  { id: "orbits", label: "Orbit'ler" },
  { id: "likes", label: "Beğeni" },
];

export function ProfileTabs({
  active,
  onChange,
}: {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) {
  return (
    <nav
      className="sticky top-[53px] z-40 bg-bg-primary/90 backdrop-blur-md border-b border-border"
      aria-label="Profil sekmeleri"
    >
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex-1 min-w-[80px] py-4 text-[15px] transition-colors whitespace-nowrap px-2",
              active === t.id ? "tab-active" : "tab-inactive",
            )}
          >
            {t.label}
            {active === t.id ? (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent rounded-full"
                aria-hidden
              />
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}
