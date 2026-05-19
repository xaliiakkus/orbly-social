"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || sessionStatus === "loading" || !hydrated) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (user && !user.onboarded) {
      router.replace("/onboarding");
    }
  }, [ready, sessionStatus, hydrated, isAuthenticated, user, router]);

  const loading =
    !ready ||
    sessionStatus === "loading" ||
    !hydrated ||
    !isAuthenticated() ||
    (user !== null && !user.onboarded);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Yükleniyor…
      </div>
    );
  }

  return <>{children}</>;
}
