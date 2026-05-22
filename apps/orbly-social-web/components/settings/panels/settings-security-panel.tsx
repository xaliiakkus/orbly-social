"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { ForgotPasswordModal } from "@/components/settings/forgot-password-modal";

export function SettingsSecurityPanel() {
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <>
      <div className="flex-1 divide-y divide-border">
        <div className="px-4 py-4">
          <p className="text-[15px] text-text-secondary leading-5">
            Hesap güvenliği ve oturum yönetimi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="flex items-start gap-4 px-4 py-4 w-full text-left hover:bg-bg-hover transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px]">Şifreni değiştir</p>
            <p className="text-text-secondary text-[15px]">E-posta ile sıfırlama bağlantısı gönder</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
        </button>

        <div className="px-4 py-4 opacity-60">
          <p className="font-bold text-[15px]">İki faktörlü kimlik doğrulama</p>
          <p className="text-text-secondary text-[15px] mt-1">Yakında</p>
        </div>

        <div className="px-4 py-4 opacity-60">
          <p className="font-bold text-[15px]">Uygulama ve oturumlar</p>
          <p className="text-text-secondary text-[15px] mt-1">Bağlı cihazları görüntüle — yakında</p>
        </div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
