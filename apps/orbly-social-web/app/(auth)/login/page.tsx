"use client";

import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AccountLimitModal } from "@/components/auth/account-limit-modal";
import { AccountSwitcher } from "@/components/auth/account-switcher";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cancelAddAccount } from "@/lib/cancel-add-account";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [email, setEmail] = useState("demo@orbly.social");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const addAccount = searchParams.get("addAccount") === "1";
  const savedCount = useDeviceAccountsStore((s) => s.accounts.length);
  const canAddNewAccount = useDeviceAccountsStore((s) => s.canAddNewAccount);

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
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(
        res.error === "CredentialsSignin"
          ? "E-posta veya şifre hatalı."
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

  return (
    <div className="w-full max-w-[400px]">
      {addAccount && (
        <button
          type="button"
          onClick={() => void handleCancelAddAccount()}
          className="flex items-center gap-2 mb-5 -ml-1 p-1 rounded-full hover:bg-bg-hover text-[15px] font-bold transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Önceki hesaba dön
        </button>
      )}
      <Logo size="xl" linked={false} className="mx-auto mb-6 lg:hidden" />
      <h1
        className={`text-3xl font-bold ${addAccount ? "mb-2" : "mb-8"}`}
      >
        {addAccount ? "Başka hesap ekle" : "Orbly'ye giriş yap"}
      </h1>
      {addAccount && (
        <p className="text-text-secondary text-[15px] mb-4 leading-relaxed">
          Bu cihazda kayıtlı hesap: {savedCount}/3. Yeni giriş, listeye eklenir.
        </p>
      )}

      {addAccount && (
        <Button
          type="button"
          variant="outline"
          className="w-full mb-6 font-bold"
          onClick={() => void handleCancelAddAccount()}
        >
          Vazgeç
        </Button>
      )}

      {savedCount > 0 && (
        <div className="mb-6 rounded-2xl border border-border overflow-hidden">
          {addAccount && (
            <p className="px-4 pt-3 pb-1 text-[13px] text-text-secondary">
              Kayıtlı hesaba geç
            </p>
          )}
          <AccountSwitcher hideAddAccount={addAccount} loginMode />
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-secondary">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border border-border rounded px-3 py-3 text-[15px] outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-secondary">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent border border-border rounded px-3 py-3 text-[15px] outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-like text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Giriş yapılıyor…" : addAccount ? "Hesabı ekle" : "Giriş yap"}
        </Button>
      </form>
      <div className="mt-4 space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauth("google")}
        >
          Google ile devam et
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => oauth("apple")}
        >
          Apple ile devam et
        </Button>
      </div>
      <p className="mt-6 text-text-secondary text-[15px]">
        Hesabın yok mu?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Kayıt ol
        </Link>
      </p>

      <AccountLimitModal open={limitOpen} onClose={() => setLimitOpen(false)} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-text-secondary">Yükleniyor…</p>}>
      <LoginForm />
    </Suspense>
  );
}
