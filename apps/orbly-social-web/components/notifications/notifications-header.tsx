"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth-store";

export function NotificationsHeader({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border">
      <div className="relative flex items-center justify-center h-[53px] px-3">
        {user ? (
          <button
            type="button"
            onClick={onMenuOpen}
            className="absolute left-3 rounded-full hover:opacity-90 md:hidden"
            aria-label="Hesap menüsü"
          >
            <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
          </button>
        ) : (
          <span className="absolute left-3 w-8 md:hidden" />
        )}
        <h1 className="text-xl font-extrabold">Bildirimler</h1>
        <Link
          href="/settings?section=notifications"
          className="absolute right-3 p-2 rounded-full hover:bg-bg-hover"
          aria-label="Bildirim ayarları"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
