"use client";

import { usePathname } from "next/navigation";

import { LeftSidebar } from "@/components/layout/left-sidebar";
import { MobileComposeFab } from "@/components/layout/mobile-compose-fab";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { ReplyComposeShell } from "@/components/post/reply-compose-shell";
import { cn } from "@/lib/cn";

/** Orta sütun + sağ panel toplamı; sayfa değişince iskelet kaymasın */
const CENTER_CLUSTER_CLASS = "w-full max-w-[950px] min-w-0 shrink-0";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/settings");
  const isLiveBroadcast = /^\/live\/[^/]+(\/ozet)?$/.test(pathname ?? "");

  return (
    <ReplyComposeShell>
      <div className="flex min-h-screen justify-center items-start w-full">
        <LeftSidebar />
        <div
          className={cn(
            "flex min-h-screen min-w-0",
            isLiveBroadcast ? "max-w-[min(100%,1280px)] w-full" : CENTER_CLUSTER_CLASS,
          )}
        >
          <main
            className={cn(
              "min-h-screen bg-bg-primary border-border",
              !isLiveBroadcast &&
                "pb-[calc(53px+env(safe-area-inset-bottom))] md:pb-0",
              "max-md:border-x-0 md:border-x",
              isSettings || isLiveBroadcast
                ? "flex-1 min-w-0 w-full max-md:border-x"
                : "w-full max-w-feed max-md:max-w-none shrink-0",
            )}
          >
            {children}
          </main>
          {!isSettings && !isLiveBroadcast && <RightSidebar />}
        </div>
      </div>
      {!isLiveBroadcast && <MobileNav />}
      {!isLiveBroadcast && <MobileComposeFab />}
    </ReplyComposeShell>
  );
}
