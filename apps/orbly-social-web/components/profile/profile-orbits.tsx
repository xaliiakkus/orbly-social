"use client";

import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { OrbitPublic } from "@orbly/types";

function OrbitRow({ orbit, isSelf }: { orbit: OrbitPublic; isSelf?: boolean }) {
  return (
    <Link
      href={`/orbits/${orbit.slug}`}
      className="block px-4 py-4 border-b border-border hover:bg-bg-hover/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0",
            "text-orbit font-extrabold text-xl",
          )}
        >
          {orbit.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold truncate">{orbit.name}</h3>
              {orbit.description ? (
                <p className="text-[14px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                  {orbit.description}
                </p>
              ) : null}
            </div>
            {isSelf ? (
              <span className="btn-outline text-[14px] px-3 py-1.5 shrink-0 pointer-events-none">
                Üye
              </span>
            ) : (
              <span className="text-[13px] font-bold text-accent shrink-0">Gör</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-[13px] text-text-secondary">
            <span>
              <span className="font-medium text-text-primary tabular-nums">
                {formatCount(orbit.stats.memberCount)}
              </span>{" "}
              üye
            </span>
            <span>
              <span className="font-medium text-text-primary tabular-nums">
                {formatCount(orbit.stats.postCount)}
              </span>{" "}
              gönderi
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProfileOrbits({ username, isSelf }: { username: string; isSelf?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile-orbits", username],
    queryFn: () => api.users.orbits(username),
    enabled: !!username,
  });

  if (isLoading) return <PageLoading />;

  if (isError) {
    return (
      <EmptyState
        icon={Sparkles}
        title={"Orbit'ler yüklenemedi"}
        description={formatUserError(error)}
        action={
          <button type="button" className="text-accent font-semibold" onClick={() => void refetch()}>
            Tekrar dene
          </button>
        }
        className="py-16"
      />
    );
  }

  const list = data?.data ?? [];
  if (!list.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-profile-fade-in">
        <Sparkles className="h-10 w-10 text-text-secondary mb-3" />
        <p className="text-[17px] font-bold text-text-primary">Henüz orbit yok</p>
        <p className="text-[15px] text-text-secondary mt-2 max-w-sm">
          {isSelf
            ? "Orbit sayfasından topluluklara katılabilirsin."
            : "Bu kullanıcı henüz bir orbit'e katılmamış."}
        </p>
        {isSelf ? (
          <Link href="/orbits" className="mt-4 text-accent font-bold text-[15px] hover:underline">
            {"Orbit'leri keşfet"}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border animate-profile-fade-in">
      {list.map((orbit) => (
        <OrbitRow key={orbit.id} orbit={orbit} isSelf={isSelf} />
      ))}
    </div>
  );
}
