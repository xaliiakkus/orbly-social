"use client";

import {
  Bell,
  Bookmark,
  Home,
  Mail,
  PenLine,
  Search,
  Settings,
  Radio,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountSwitcher } from "@/components/auth/account-switcher";
import { NotificationNavBadge } from "@/components/notifications/notification-nav-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo, OrblyWordmark } from "@/components/ui/logo";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/home", label: "Ana Sayfa", icon: Home },
  { href: "/explore", label: "Keşfet", icon: Search },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
  { href: "/messages", label: "Mesajlar", icon: Mail },
  { href: "/live", label: "Canlı", icon: Radio },
  { href: "/orbits", label: "Orbit'ler", icon: Sparkles },
  { href: "/bookmarks", label: "Yer İmleri", icon: Bookmark },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden md:flex md:w-[72px] xl:w-[275px] shrink-0 h-dvh sticky top-0 border-r border-border z-20">
      <div className="flex flex-col h-full w-full max-w-[275px] mx-auto px-1.5 xl:px-3">
        <Link
          href="/home"
          className="flex items-center gap-3 p-3 w-fit xl:w-full rounded-full hover:bg-bg-hover transition-colors shrink-0"
        >
          <Logo />
          <OrblyWordmark className="hidden xl:inline" />
        </Link>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide py-1">
          <div className="flex flex-col gap-0.5">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={cn(
                    "flex items-center gap-5 rounded-full px-3 py-2.5 transition-colors hover:bg-bg-hover",
                    active && "font-bold bg-bg-hover",
                  )}
                >
                  <span className="relative shrink-0">
                    <Icon
                      className={cn(
                        "h-[26px] w-[26px]",
                        active && "stroke-[2.5]",
                      )}
                    />
                    {href === "/notifications" ? <NotificationNavBadge /> : null}
                  </span>
                  <span className="hidden xl:inline text-[20px] leading-6">{label}</span>
                </Link>
              );
            })}
            {user && (
              <Link
                href={`/profile/${user.username}`}
                title="Profil"
                className={cn(
                  "flex items-center gap-5 rounded-full px-3 py-2.5 transition-colors hover:bg-bg-hover",
                  pathname.startsWith(`/profile/${user.username}`) && "font-bold bg-bg-hover",
                )}
              >
                <User className="h-[26px] w-[26px] shrink-0" />
                <span className="hidden xl:inline text-[20px] leading-6">Profil</span>
              </Link>
            )}
          </div>
        </nav>

        <div className="hidden xl:block shrink-0 border-t border-border mt-2 mx-1">
          <AccountSwitcher />
        </div>

        <div className="shrink-0 pt-2 pb-4 space-y-3">
          <Link href="/home" className="block">
            <Button
              size="lg"
              className={cn(
                "font-bold shadow-lg shadow-accent/25",
                "hidden xl:flex w-[90%] mx-auto justify-center gap-2 py-3",
              )}
            >
              <PenLine className="h-5 w-5" />
              Gönder
            </Button>
            <Button
              size="lg"
              aria-label="Gönder"
              className="xl:hidden mx-auto h-[52px] w-[52px] rounded-full p-0 flex items-center justify-center"
            >
              <PenLine className="h-6 w-6" />
            </Button>
          </Link>

          {user && (
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 rounded-full p-2.5 hover:bg-bg-hover transition-colors"
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="md" />
              <div className="hidden xl:block min-w-0 flex-1 text-left">
                <p className="font-bold truncate text-[15px]">{user.displayName}</p>
                <p className="text-text-secondary truncate text-[15px]">@{user.username}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
