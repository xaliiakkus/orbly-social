"use client";

import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

import { MAX_DEVICE_ACCOUNTS } from "@/lib/device-accounts-store";

export function AccountLimitModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-labelledby="account-limit-title"
        className="relative w-full max-w-md rounded-2xl bg-bg-primary border border-border p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-bg-hover"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <AlertTriangle className="h-6 w-6 text-like shrink-0 mt-0.5" />
          <div>
            <h2 id="account-limit-title" className="text-lg font-extrabold">
              Hesap limiti
            </h2>
            <p className="text-text-secondary text-[15px] mt-2 leading-relaxed">
              Aynı cihazda en fazla <strong>{MAX_DEVICE_ACCOUNTS} hesap</strong>{" "}
              kullanılabilir. Dördüncü bir hesap eklemek platform kurallarına aykırıdır
              ve <strong>hesabın kalıcı olarak kapatılmasına</strong> yol açabilir.
            </p>
            <p className="text-text-secondary text-[15px] mt-3 leading-relaxed">
              Yeni hesap eklemek için önce bu cihazdan kayıtlı hesaplardan birinin
              oturumunu kapat.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-full bg-accent text-white font-bold hover:bg-accent-hover"
        >
          Anladım
        </button>
      </div>
    </div>,
    document.body,
  );
}
