"use client";

import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { formatUserError } from "@orbly/api-client";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";

import { AccountLimitModal } from "@/components/auth/account-limit-modal";
import { AccountSwitcher } from "@/components/auth/account-switcher";
import { Button } from "@/components/ui/button";
import { Logo, OrblyWordmark } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { supportMailtoSubject } from "@/lib/app-contact";
import { cancelAddAccount } from "@/lib/cancel-add-account";
import { MAX_DEVICE_ACCOUNTS, useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { cn } from "@/lib/cn";

type AuthView = "login" | "forgot" | "forgot-sent" | "reset";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.79 15.25 3.8 8.62 7.34 6.5c1.12-.73 2.45-1.15 3.78-1.12 1.18.02 2.28.7 3 .7.7 0 2.01-.86 3.4-.73.58.02 2.21.24 3.26 1.78-2.86 1.74-2.4 5.58.48 6.84-.57 1.48-1.32 2.95-2.21 4.31zM12.03 6.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AuthDivider() {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="text-[13px] font-medium text-text-tertiary uppercase tracking-wider">
        veya
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  trailing,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-text-secondary">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-transparent",
          "transition-colors duration-200 auth-input-glow",
        )}
      >
        <Icon className="ml-3.5 h-[18px] w-[18px] shrink-0 text-text-tertiary" aria-hidden />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent py-3.5 pr-3 text-[15px] outline-none placeholder:text-text-tertiary"
        />
        {trailing}
      </div>
    </div>
  );
}

function OAuthButton({
  provider,
  label,
  onClick,
}: {
  provider: "google" | "apple";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-center gap-3 rounded-full border border-border",
        "bg-transparent px-4 py-3 text-[15px] font-bold transition-colors duration-200",
        "hover:bg-bg-hover hover:border-border/80 hover:scale-[1.01] active:scale-[0.99]",
      )}
    >
      {provider === "google" ? (
        <GoogleIcon className="h-5 w-5" />
      ) : (
        <AppleIcon className="h-5 w-5" />
      )}
      {label}
    </button>
  );
}

function AccountSlotsBar({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5 flex-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < used ? "bg-accent" : "bg-border",
            )}
          />
        ))}
      </div>
      <span className="text-[13px] font-semibold text-text-secondary tabular-nums">
        {used}/{max}
      </span>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const loginId = useId();
  const passwordId = useId();
  const forgotEmailId = useId();
  const forgotUsernameId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const resetTokenParam = searchParams.get("resetToken") ?? "";
  const [view, setView] = useState<AuthView>("login");
  const [resetToken, setResetToken] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const addAccount = searchParams.get("addAccount") === "1";
  const savedCount = useDeviceAccountsStore((s) => s.accounts.length);
  const canAddNewAccount = useDeviceAccountsStore((s) => s.canAddNewAccount);

  useEffect(() => {
    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setView("reset");
      setError("");
      setSuccess("");
    }
  }, [resetTokenParam]);

  const goToLogin = (message?: string) => {
    setView("login");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(message ?? "");
    if (resetTokenParam) router.replace("/login");
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({
        email: forgotEmail.trim(),
        username: forgotUsername.trim().toLowerCase(),
      });
      setSuccess(res.message);
      setView("forgot-sent");
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({
        token: resetToken,
        password: newPassword,
        confirmPassword,
      });
      goToLogin(res.message);
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "account_limit" || sessionStorage.getItem("orbly-account-limit-error")) {
      sessionStorage.removeItem("orbly-account-limit-error");
      setLimitOpen(true);
      setError(
        "Bu cihazda en fazla 3 hesap kullanılabilir. Dördüncü hesap eklemek ban sebebidir.",
      );
    } else if (authError === "Configuration") {
      setError(
        "Giriş servisi yapılandırılmamış. Yöneticiyle iletişime geç veya daha sonra tekrar dene.",
      );
    } else if (authError === "session_expired") {
      setError("Oturumun sona erdi. Lütfen tekrar giriş yap.");
    } else if (authError) {
      setError("Giriş başarısız. Lütfen tekrar deneyin.");
    }
  }, [searchParams]);

  const guardAddAccount = () => {
    if (!canAddNewAccount) {
      setLimitOpen(true);
      return false;
    }
    sessionStorage.setItem("orbly-add-account", "1");
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (addAccount && !canAddNewAccount) {
      setLimitOpen(true);
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      login: login.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(
        res.error === "CredentialsSignin"
          ? "E-posta, kullanıcı adı veya şifre hatalı."
          : "Giriş başarısız. Lütfen tekrar dene.",
      );
      return;
    }
    const session = await getSession();
    const userId = (session?.orblyUser as { id?: string } | undefined)?.id;
    if (userId && useDeviceAccountsStore.getState().wouldExceedLimit(userId)) {
      await signOut({ redirect: false });
      setLimitOpen(true);
      setError("Bu cihazda en fazla 3 hesap kullanılabilir.");
      return;
    }
    router.push("/home");
    router.refresh();
  };

  const oauth = (provider: "google" | "apple") => {
    if (addAccount && !guardAddAccount()) return;
    void signIn(provider, { callbackUrl: addAccount ? "/home?addAccount=1" : "/home" });
  };

  const handleCancelAddAccount = async () => {
    const result = await cancelAddAccount(update);
    router.push(result.path);
    router.refresh();
  };

  if (view !== "login") {
    const title =
      view === "forgot"
        ? "Şifremi unuttum"
        : view === "forgot-sent"
          ? "E-postanı kontrol et"
          : "Yeni şifre belirle";
    const subtitle =
      view === "forgot"
        ? "Kayıtlı e-posta ve kullanıcı adını gir; şifre sıfırlama bağlantısını gönderelim."
        : view === "forgot-sent"
          ? "Eşleşen bir hesap varsa şirket e-postamızdan sıfırlama bağlantısı geldi."
          : "Yeni şifreni iki kez gir; ardından giriş ekranına döneceksin.";

    return (
      <div className="w-full max-w-[440px] auth-animate-in">
        <button
          type="button"
          onClick={() => (view === "forgot-sent" ? goToLogin() : setView("login"))}
          className={cn(
            "mb-5 flex items-center gap-2 rounded-full px-2 py-1.5 -ml-1",
            "text-[15px] font-bold text-text-secondary transition-colors",
            "hover:bg-bg-hover hover:text-text-primary",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Giriş ekranına dön
        </button>

        <div className="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left">
          <Logo size="lg" linked={false} className="mb-4 lg:hidden" />
          <div className="hidden lg:flex items-center gap-2 mb-3">
            <OrblyWordmark className="text-2xl" />
          </div>
          <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary leading-relaxed max-w-sm">
            {subtitle}
          </p>
        </div>

        {view === "forgot-sent" ? (
          <div className="space-y-4">
            <div className="flex gap-2.5 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-3 text-sm text-text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-accent" aria-hidden />
              <span className="leading-snug">{success}</span>
            </div>
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="w-full !rounded-full"
              onClick={() => goToLogin()}
            >
              Giriş yap
            </Button>
          </div>
        ) : view === "forgot" ? (
          <form onSubmit={submitForgot} className="space-y-4">
            <AuthField
              id={forgotEmailId}
              label="E-posta"
              type="email"
              value={forgotEmail}
              onChange={setForgotEmail}
              icon={Mail}
              autoComplete="email"
            />
            <AuthField
              id={forgotUsernameId}
              label="Kullanıcı adı"
              type="text"
              value={forgotUsername}
              onChange={(v) => setForgotUsername(v.toLowerCase())}
              icon={User}
              autoComplete="username"
            />
            {error && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-xl border border-like/30 bg-like/10 px-3.5 py-3 text-sm text-like"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full !rounded-full shadow-lg shadow-accent/20"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Gönderiliyor…
                </span>
              ) : (
                "Sıfırlama bağlantısı gönder"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            <AuthField
              id={newPasswordId}
              label="Yeni şifre"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={setNewPassword}
              icon={Lock}
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="mr-3 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  aria-label={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              }
            />
            <AuthField
              id={confirmPasswordId}
              label="Yeni şifre (tekrar)"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
              icon={Lock}
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="mr-3 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              }
            />
            {error && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-xl border border-like/30 bg-like/10 px-3.5 py-3 text-sm text-like"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full !rounded-full shadow-lg shadow-accent/20"
              disabled={loading || !resetToken}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Kaydediliyor…
                </span>
              ) : (
                "Şifreyi kaydet"
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] auth-animate-in">
      <div className="relative">
        {addAccount && (
          <button
            type="button"
            onClick={() => void handleCancelAddAccount()}
            className={cn(
              "mb-5 flex items-center gap-2 rounded-full px-2 py-1.5 -ml-1",
              "text-[15px] font-bold text-text-secondary transition-colors",
              "hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Önceki hesaba dön
          </button>
        )}

        <div className="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left">
          <Logo size="lg" linked={false} className="mb-4 lg:hidden" />
          <div className="hidden lg:flex items-center gap-2 mb-3">
            <OrblyWordmark className="text-2xl" />
          </div>
          <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight leading-tight">
            {addAccount ? "Başka hesap ekle" : "Tekrar hoş geldin"}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary leading-relaxed max-w-sm">
            {addAccount
              ? "Yeni giriş bu cihazdaki hesap listene eklenir."
              : "Hesabınla giriş yap veya hızlıca devam et."}
          </p>
        </div>

        {addAccount && (
          <div className="mb-6 rounded-2xl border border-border bg-bg-secondary p-4 auth-animate-in auth-delay-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-text-secondary">
                Cihaz hesap kotası
              </span>
              {!canAddNewAccount && (
                <span className="text-[11px] font-bold uppercase tracking-wide text-like">
                  Dolu
                </span>
              )}
            </div>
            <AccountSlotsBar used={savedCount} max={MAX_DEVICE_ACCOUNTS} />
            <p className="mt-2.5 text-[13px] text-text-tertiary leading-snug">
              En fazla {MAX_DEVICE_ACCOUNTS} hesap. Yeni giriş listeye eklenir.
            </p>
          </div>
        )}

        {savedCount > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-secondary auth-animate-in auth-delay-2">
            {addAccount && (
              <p className="px-4 pt-3.5 pb-1 text-[13px] font-semibold text-text-secondary">
                Kayıtlı hesaba geç
              </p>
            )}
            <AccountSwitcher hideAddAccount={addAccount} loginMode />
          </div>
        )}

        {savedCount > 0 && !addAccount && <AuthDivider />}

        <form onSubmit={submit} className="space-y-4 auth-animate-in auth-delay-3">
          <AuthField
            id={loginId}
            label="E-posta veya kullanıcı adı"
            type="text"
            value={login}
            onChange={(v) => setLogin(v.includes("@") ? v : v.toLowerCase())}
            icon={User}
            autoComplete="username"
          />
          {!addAccount && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => {
                  const trimmed = login.trim();
                  if (trimmed.includes("@")) {
                    setForgotEmail(trimmed);
                    setForgotUsername("");
                  } else {
                    setForgotEmail("");
                    setForgotUsername(trimmed.toLowerCase());
                  }
                  setError("");
                  setSuccess("");
                  setView("forgot");
                }}
                className="text-[13px] font-semibold text-accent hover:underline underline-offset-4"
              >
                Şifremi unuttum
              </button>
            </div>
          )}
          <AuthField
            id={passwordId}
            label="Şifre"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            icon={Lock}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mr-3 rounded-lg p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            }
          />

          {success && (
            <div
              role="status"
              className="flex gap-2.5 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-3 text-sm text-text-primary"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-accent" aria-hidden />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex gap-2.5 rounded-xl border border-like/30 bg-like/10 px-3.5 py-3 text-sm text-like"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full !rounded-full shadow-lg shadow-accent/20"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Giriş yapılıyor…
              </span>
            ) : addAccount ? (
              "Hesabı ekle"
            ) : (
              "Giriş yap"
            )}
          </Button>

        </form>

        <div className="mt-5 space-y-3 auth-animate-in auth-delay-4">
          <AuthDivider />
          <OAuthButton
            provider="google"
            label="Google ile devam et"
            onClick={() => oauth("google")}
          />
          <OAuthButton
            provider="apple"
            label="Apple ile devam et"
            onClick={() => oauth("apple")}
          />
        </div>

        <p className="mt-8 text-center text-[15px] text-text-secondary auth-animate-in auth-delay-5">
          Hesabın yok mu?{" "}
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 font-bold text-accent hover:underline underline-offset-4"
          >
            <UserPlus className="h-4 w-4 inline" aria-hidden />
            Kayıt ol
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-[12px] text-text-tertiary leading-relaxed px-4 auth-animate-in auth-delay-5">
        Giriş yaparak platform kurallarına ve gizlilik ilkelerine uymayı kabul edersin.
        <br />
        Yardım:{" "}
        <a href={supportMailtoSubject("Destek")} className="text-accent hover:underline">
          info@orbly.social
        </a>
      </p>

      <AccountLimitModal open={limitOpen} onClose={() => setLimitOpen(false)} />
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-[440px] animate-pulse">
      <div className="h-8 w-48 bg-border/60 rounded-lg mb-3" />
      <div className="h-4 w-full max-w-xs bg-border/40 rounded mb-8" />
      <div className="space-y-4">
        <div className="h-14 bg-border/30 rounded-xl" />
        <div className="h-14 bg-border/30 rounded-xl" />
        <div className="h-12 bg-border/50 rounded-full" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}