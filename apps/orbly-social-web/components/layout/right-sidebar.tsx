"use client";

import { LiveSpacesSidebar } from "@/components/live/live-spaces-sidebar";
import { MobileSearchBar } from "@/components/layout/mobile-search-bar";
import { TrendingCard } from "@/components/layout/trending-card";

export function RightSidebar() {
  return (
    <aside className="hidden lg:block w-[350px] shrink-0 py-2 pl-4 pr-6">
      <div className="sticky top-2 space-y-4 max-h-[calc(100dvh-16px)] overflow-y-auto scrollbar-hide">
        <MobileSearchBar />

        <TrendingCard />

        <LiveSpacesSidebar />

        <footer className="px-2 text-text-tertiary text-[13px] leading-5">
          <span>© 2026 Orbly</span>
        </footer>
      </div>
    </aside>
  );
}
