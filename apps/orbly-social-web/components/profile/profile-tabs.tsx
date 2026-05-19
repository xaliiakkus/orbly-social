"use client";

import { cn } from "@/lib/cn";

export type ProfileTab =
  | "posts"
  | "broadcasts"
  | "replies"
  | "highlights"
  | "articles"
  | "media"
  | "likes";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Gönderiler" },
  { id: "broadcasts", label: "Yayınlar" },
  { id: "replies", label: "Yanıtlar" },
  { id: "highlights", label: "Öne Çıkanlar" },
  { id: "articles", label: "Makaleler" },
  { id: "media", label: "Medya" },
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
      className="sticky top-[53px] z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border"
      aria-label="Profil sekmeleri"
    >
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex-shrink-0 px-4 py-4 text-[15px] text-text-secondary hover:bg-bg-hover transition-colors whitespace-nowrap",
              active === t.id && "font-bold text-text-primary",
            )}
          >
            {t.label}
            {active === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-accent"
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
