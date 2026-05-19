"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FeedList } from "@/components/feed/feed-list";
import { MobileMenuDrawer } from "@/components/layout/mobile-menu-drawer";
import { MobileSpacesBanner } from "@/components/layout/mobile-spaces-banner";
import { ComposeBox } from "@/components/post/compose-box";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

const tabs = [
  { id: "for-you" as const, label: "Sana özel" },
  { id: "following" as const, label: "Takip ediliyor" },
];

export default function HomePage() {
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [feedBanner, setFeedBanner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border">
        {/* X tarzı: avatar | logo | sağ aksiyon */}
        <div className="relative flex items-center justify-between px-3 h-[53px] md:hidden">
          {user ? (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="shrink-0 rounded-full hover:opacity-90 z-10"
              aria-label="Hesap menüsü"
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <Logo className="absolute left-1/2 -translate-x-1/2" />
          <Link
            href="/orbits"
            className="p-2 rounded-full hover:bg-bg-hover shrink-0 z-10"
            aria-label="Orbit'ler"
          >
            <Sparkles className="h-5 w-5 text-orbit" />
          </Link>
        </div>

        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 py-4 text-[15px] text-text-secondary hover:bg-bg-hover transition-colors relative whitespace-nowrap px-2",
                tab === t.id && "font-bold text-text-primary",
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[4px] w-14 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      </header>

      <MobileSpacesBanner />

      {feedBanner && (
        <button
          type="button"
          className="sticky top-[106px] md:top-[53px] z-30 w-full py-2.5 bg-accent text-white text-[15px] font-bold hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          onClick={() => {
            setFeedBanner(false);
            void qc.invalidateQueries({ queryKey: ["feed"] });
          }}
        >
          Yeni gönderileri göster
        </button>
      )}

      <ComposeBox className="hidden md:flex border-b border-border" />

      <div className="flex-1 pb-2">
        <FeedList mode={tab} onNewPosts={() => setFeedBanner(true)} />
      </div>

      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
