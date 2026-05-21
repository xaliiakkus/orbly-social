"use client";

import { Bell, Home, Mail, Radio, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MessageNavBadge } from "@/components/messages/message-nav-badge";
import { NotificationNavBadge } from "@/components/notifications/notification-nav-badge";
import { cn } from "@/lib/cn";

/** X mobil web alt çubuğu: 5 eşit ikon, ortada FAB yok */
const links = [
  { href: "/home", icon: Home, label: "Ana Sayfa" },
  { href: "/explore", icon: Search, label: "Keşfet" },
  { href: "/live", icon: Radio, label: "Canlı" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/messages", icon: Mail, label: "Mesajlar" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-50",
        "border-t border-border bg-bg-primary/95 backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="flex items-center justify-around h-[53px] w-full max-w-feed mx-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative p-2.5 text-text-secondary transition-colors",
                active && "text-text-primary",
              )}
            >
              <Icon
                className={cn("h-[26px] w-[26px]", active && "stroke-[2.5]")}
              />
              {href === "/notifications" ? (
                <NotificationNavBadge className="top-1 left-[calc(50%+8px)]" />
              ) : null}
              {href === "/messages" ? (
                <MessageNavBadge className="top-1 left-[calc(50%+8px)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
