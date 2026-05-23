"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatUserError } from "@orbly/api-client";

import { AuthLegalLinks } from "@/components/legal/auth-legal-links";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.register(form);
      setAuth(res);
      const session = await signIn("credentials", {
        login: form.email,
        password: form.password,
        redirect: false,
      });
      if (session?.error) {
        setError("Hesap oluşturuldu; giriş sayfasından oturum açın.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-text-secondary">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required
        className="w-full bg-transparent border border-border rounded px-3 py-3 text-[15px] outline-none focus:border-accent"
      />
    </div>
  );

  return (
    <div className="w-full max-w-[400px]">
      <Logo size="xl" linked={false} className="mx-auto mb-6 lg:hidden" />
      <h1 className="text-3xl font-bold mb-8">Hesap oluştur</h1>
      <form onSubmit={submit} className="space-y-4">
        {field("displayName", "Ad")}
        {field("username", "Kullanıcı adı")}
        {field("email", "E-posta", "email")}
        {field("password", "Şifre", "password")}
        {error && <p className="text-like text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Kaydediliyor…" : "Kayıt ol"}
        </Button>
      </form>
      <AuthLegalLinks variant="signup" />

      <p className="mt-6 text-text-secondary text-[15px] text-center">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
