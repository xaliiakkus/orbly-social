"use client";

import { LiveSpacesSidebar } from "@/components/live/live-spaces-sidebar";
import { MobileSearchBar } from "@/components/layout/mobile-search-bar";
import { TrendingCard } from "@/components/layout/trending-card";

/** Ana sayfada masaüstü sağ panel içeriği (lg altı) */
export function MobileHomeExtras() {
  return (
    <section className="lg:hidden border-b border-border px-4 py-3 space-y-3 bg-bg-primary">
      <MobileSearchBar />
      <LiveSpacesSidebar />
      <TrendingCard />
    </section>
  );
}
