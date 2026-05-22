"use client";

import { formatUserError } from "@orbly/api-client";
import { Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const emailId = useId();
  const usernameId = useId();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(user?.username ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!open || typeof document === "undefined") return null;

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword({
        email: email.trim(),
        username: username.trim().toLowerCase(),
      });
      setSent(true);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg-primary shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[17px] font-extrabold">Şifre sıfırlama</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-hover"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {sent ? (
            <p className="text-[15px] text-text-secondary leading-5">
              E-posta adresine şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam
              klasörünü kontrol et.
            </p>
          ) : (
            <>
              <p className="text-[15px] text-text-secondary leading-5">
                Kayıtlı e-posta ve kullanıcı adını gir. Sıfırlama bağlantısı e-postana
                gönderilir.
              </p>
              <label className="block space-y-1.5" htmlFor={emailId}>
                <span className="text-sm font-semibold text-text-secondary">E-posta</span>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-[15px] outline-none focus:border-accent"
                  autoComplete="email"
                />
              </label>
              <label className="block space-y-1.5" htmlFor={usernameId}>
                <span className="text-sm font-semibold text-text-secondary">Kullanıcı adı</span>
                <input
                  id={usernameId}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-[15px] outline-none focus:border-accent"
                  autoComplete="username"
                />
              </label>
              {error ? (
                <p className="text-[14px] text-like">{error}</p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            {sent ? "Tamam" : "İptal"}
          </Button>
          {!sent ? (
            <Button onClick={() => void submit()} disabled={loading || !email.trim() || !username.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gönder"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
