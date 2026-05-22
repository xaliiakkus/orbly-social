"use client";

import { formatUserError } from "@orbly/api-client";
import Link from "next/link";
import { useState } from "react";

import { AutoSaveStatus, type AutoSaveState } from "@/components/settings/auto-save-status";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function SettingsPrivacyPanel() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saveState, setSaveState] = useState<AutoSaveState>("idle");
  const [error, setError] = useState("");

  if (!user) return null;

  const togglePrivate = async (isPrivate: boolean) => {
    const previous = user.isPrivate;
    setUser({ ...user, isPrivate });
    setSaveState("saving");
    setError("");
    try {
      const { user: updated } = await api.users.updateMe({ isPrivate });
      setUser(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (e) {
      setUser({ ...user, isPrivate: previous });
      setError(formatUserError(e));
      setSaveState("error");
    }
  };

  return (
    <div className="flex-1 divide-y divide-border">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-bg-secondary/30">
        <p className="text-[13px] text-text-secondary">Değişiklikler otomatik kaydedilir.</p>
        <AutoSaveStatus state={saveState} error={error || undefined} />
      </div>
      <div className="px-4 py-4 relative">
        <SettingsToggle
          label="Gizli hesap"
          description="Onaylamadığın kişiler gönderilerini göremez"
          checked={user.isPrivate}
          onChange={(v) => void togglePrivate(v)}
        />
      </div>

      <Link
        href={`/profile/${user.username}`}
        className="flex items-center justify-between px-4 py-4 hover:bg-bg-hover transition-colors"
      >
        <div>
          <p className="font-bold text-[15px]">Profilini görüntüle</p>
          <p className="text-text-secondary text-[15px]">Başkalarının gördüğü profil</p>
        </div>
      </Link>

      <div className="px-4 py-4">
        <p className="text-[15px] text-text-secondary leading-5">
          Sessize alma ve engelleme listesi yakında eklenecek. Şimdilik profil veya gönderi
          menüsünden hesapları yönetebilirsin.
        </p>
      </div>
    </div>
  );
}
