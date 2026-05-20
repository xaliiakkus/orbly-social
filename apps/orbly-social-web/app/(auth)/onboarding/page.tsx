"use client";

import { formatUserError } from "@orbly/api-client";
import {
  canCompleteOnboarding,
  onboardingHint,
  requiredOrbitSelections,
} from "@orbly/features";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import type { OrbitPublic } from "@orbly/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
    retry: 1,
  });

  const orbits = data?.data ?? [];
  const required = requiredOrbitSelections(orbits.length);
  const canFinish = canCompleteOnboarding(selected.length, orbits.length);

  useEffect(() => {
    if (hydrated && user?.onboarded) {
      router.replace("/home");
    }
  }, [hydrated, user?.onboarded, router]);

  const completeOnboarding = useCallback(
    async (orbitIds?: string[]) => {
      setError("");
      setLoading(true);
      try {
        const res = await api.auth.onboarding({
          orbitIds: orbitIds && orbitIds.length > 0 ? orbitIds : undefined,
          onboarded: true,
        });
        setUser(res.user);
        const tokens = useAuthStore.getState();
        await updateSession({
          orblyUser: res.user,
          accessToken: tokens.accessToken ?? undefined,
          refreshToken: tokens.refreshToken ?? undefined,
          accessExpiresAt: Date.now() + 900 * 1000,
        });
        router.replace("/home");
      } catch (err) {
        setError(formatUserError(err));
      } finally {
        setLoading(false);
      }
    },
    [router, setUser, updateSession],
  );

  const skip = () => void completeOnboarding();

  const finish = () => {
    if (!canFinish && orbits.length > 0) return;
    void completeOnboarding(selected);
  };

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold">İlgi alanlarını seç</h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-text-secondary hover:text-text-primary"
          disabled={loading}
          onClick={skip}
        >
          Atla
        </Button>
      </div>
      <p className="text-text-secondary mb-6 text-[15px]">{onboardingHint(orbits.length)}</p>

      {isLoading && (
        <p className="text-text-secondary text-center py-8">Orbit&apos;ler yükleniyor…</p>
      )}

      {isError && (
        <div className="text-center py-6 space-y-3 mb-6 rounded-2xl border border-border p-4">
          <p className="text-like text-sm">
            Orbit listesi yüklenemedi. API adresinin HTTPS olduğundan emin olun.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Tekrar dene
          </Button>
        </div>
      )}

      {!isLoading && !isError && orbits.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6 max-h-[50vh] overflow-y-auto">
          {orbits.map((orbit: OrbitPublic) => (
            <button
              key={orbit.id}
              type="button"
              onClick={() => toggle(orbit.id)}
              className={cn(
                "text-left p-4 rounded-2xl border transition-colors",
                selected.includes(orbit.id)
                  ? "border-orbit bg-orbit/10"
                  : "border-border hover:bg-bg-hover",
              )}
            >
              <p className="font-bold">{orbit.name}</p>
              <p className="text-text-secondary text-sm">@{orbit.slug}</p>
              {orbit.description && (
                <p className="text-text-secondary text-xs mt-1 line-clamp-2">
                  {orbit.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !isError && orbits.length === 0 && (
        <p className="text-text-secondary text-center py-8 mb-6">
          Henüz orbit bulunmuyor. Atla ile devam edebilirsin.
        </p>
      )}

      {error && <p className="text-like text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          disabled={(!canFinish && orbits.length > 0) || loading || isLoading}
          onClick={finish}
        >
          {loading
            ? "Kaydediliyor…"
            : required === 0
              ? "Devam et"
              : `Devam et (${selected.length}/${required})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={skip}
        >
          {loading ? "Kaydediliyor…" : "Atla — şimdilik geç"}
        </Button>
      </div>
    </div>
  );
}
