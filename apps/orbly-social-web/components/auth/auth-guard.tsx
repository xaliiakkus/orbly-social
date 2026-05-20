"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || sessionStatus === "loading" || !hydrated) return;
    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (user && !user.onboarded) {
      router.replace("/onboarding");
    }
  }, [ready, sessionStatus, hydrated, user, router]);

  const loading =
    !ready || sessionStatus === "loading" || !hydrated || sessionStatus !== "authenticated";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Yükleniyor…
      </div>
    );
  }

  if (user && !user.onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Yükleniyor…
      </div>
    );
  }

  return <>{children}</>;
}
