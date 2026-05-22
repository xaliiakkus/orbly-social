"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ForgotPasswordModal } from "@/components/settings/forgot-password-modal";
import { SettingsAutoSaveNote } from "@/components/settings/settings-auto-save-note";
import { Avatar } from "@/components/ui/avatar";
import { supportMailtoSubject } from "@/lib/app-contact";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

export function SettingsAccountPanel({
  onEditProfile,
}: {
  onEditProfile: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <SettingsAutoSaveNote />
      <div className="px-4 py-5 border-b border-border flex items-center gap-4">
        <Avatar
          name={user.displayName}
          src={user.avatarUrl}
          size="lg"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-[17px] truncate">{user.displayName}</p>
          <p className="text-text-secondary text-[15px]">@{user.username}</p>
          {user.isPrivate ? (
            <span className="inline-block mt-1 text-[13px] font-semibold text-text-secondary">
              Gizli hesap
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-[14px] font-bold hover:bg-bg-hover"
        >
          Düzenle
        </button>
      </div>

      <div className="divide-y divide-border flex-1">
        <button
          type="button"
          onClick={onEditProfile}
          className="flex items-start gap-4 px-4 py-4 w-full text-left hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Hesap bilgileri</p>
            <p className="text-text-secondary text-[15px]">Ad, bio, konum, avatar</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </button>

        <Link
          href={`/profile/${user.username}`}
          className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Profil sayfası</p>
            <p className="text-text-secondary text-[15px]">Herkese açık profilini gör</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </Link>

        <Link
          href="/bookmarks"
          className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Yer imleri</p>
            <p className="text-text-secondary text-[15px]">Kaydettiğin gönderiler</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </Link>

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="flex items-start gap-4 px-4 py-4 w-full text-left hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Şifreni değiştir</p>
            <p className="text-text-secondary text-[15px]">E-posta ile sıfırlama bağlantısı</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </button>

        <a
          href={supportMailtoSubject("Orbly destek")}
          className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Yardım ve destek</p>
            <p className="text-text-secondary text-[15px]">info@orbly.social</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </a>
      </div>

      <div className="border-t border-border shrink-0">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className={cn(
            "flex items-start gap-4 px-4 py-4 w-full text-left hover:bg-bg-hover transition-colors text-like",
          )}
        >
          <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] leading-5">Oturumu kapat</p>
            <p className="text-text-secondary text-[15px] leading-5">@{user.username}</p>
          </div>
        </button>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
