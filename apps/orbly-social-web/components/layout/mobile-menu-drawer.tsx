"use client";

import {
  Bell,
  Bookmark,
  Home,
  LogOut,
  Mail,
  Radio,
  Search,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AccountSwitcher } from "@/components/auth/account-switcher";
import { Avatar } from "@/components/ui/avatar";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { useAuthStore } from "@/lib/auth-store";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/home", label: "Ana Sayfa", icon: Home },
  { href: "/explore", label: "Keşfet", icon: Search },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
  { href: "/messages", label: "Mesajlar", icon: Mail },
  { href: "/live", label: "Canlı", icon: Radio },
  { href: "/orbits", label: "Orbit'ler", icon: Sparkles },
  { href: "/bookmarks", label: "Yer İmleri", icon: Bookmark },
  { href: "/settings", label: "Ayarlar ve gizlilik", icon: Settings },
];

/** X mobil web: profil fotoğrafından açılan sol çekmece */
export function MobileMenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const removeAccount = useDeviceAccountsStore((s) => s.removeAccount);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      setEntered(false);
    };
  }, [open]);

  if (!open || typeof document === "undefined" || !user) return null;

  const profileHref = `/profile/${user.username}`;

  const handleLogout = () => {
    onClose();
    removeAccount(user.id);
    logout();
    void signOut({ callbackUrl: "/login" });
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Menüyü kapat"
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 bottom-0 flex w-[min(85vw,320px)] flex-col",
          "bg-bg-primary shadow-2xl border-r border-border overflow-y-auto",
          "pt-[max(0.75rem,env(safe-area-inset-top))]",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "transition-transform duration-300 ease-out",
          entered ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-2 pb-1">
          <Link
            href={profileHref}
            onClick={onClose}
            className="rounded-full hover:opacity-90"
          >
            <Avatar src={user.avatarUrl} name={user.displayName} size="lg" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-hover shrink-0"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Link href={profileHref} onClick={onClose} className="px-4 pb-3 block">
          <p className="font-extrabold text-[20px] leading-6 truncate">
            {user.displayName}
          </p>
          <p className="text-text-secondary text-[15px] truncate">@{user.username}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[15px]">
            <span>
              <span className="font-bold">{formatCount(user.stats.followingCount)}</span>{" "}
              <span className="text-text-secondary">Takip edilen</span>
            </span>
            <span>
              <span className="font-bold">{formatCount(user.stats.followersCount)}</span>{" "}
              <span className="text-text-secondary">Takipçi</span>
            </span>
          </p>
        </Link>

        <AccountSwitcher onClose={onClose} />

        <nav className="flex-1 py-2">
          <Link
            href={profileHref}
            onClick={onClose}
            className="flex items-center gap-5 px-5 py-3.5 text-[20px] font-bold hover:bg-bg-hover transition-colors"
          >
            <User className="h-[26px] w-[26px] shrink-0" />
            Profil
          </Link>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-5 px-5 py-3.5 text-[20px] font-bold hover:bg-bg-hover transition-colors"
            >
              <Icon className="h-[26px] w-[26px] shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-5 px-5 py-3.5 text-[20px] font-bold hover:bg-bg-hover transition-colors text-left"
          >
            <LogOut className="h-[26px] w-[26px] shrink-0" />
            Çıkış yap
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
