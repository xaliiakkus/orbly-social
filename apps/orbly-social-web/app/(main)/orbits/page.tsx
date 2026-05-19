"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function OrbitsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
  });

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (o) =>
        o.name.toLowerCase().includes(term) || o.slug.toLowerCase().includes(term),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader title="Orbit'ler" subtitle="İlgi alanına göre topluluklar" />
      <div className="p-4 border-b border-border">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Orbit ara…"
            className="w-full bg-bg-secondary rounded-full pl-11 pr-4 py-3 text-[15px] outline-none border border-transparent focus:border-accent/50 transition-colors"
          />
        </label>
      </div>

      {isLoading && <PageLoading rows={6} />}
      {isError && (
        <EmptyState
          icon={Sparkles}
          title="Orbit'ler yüklenemedi"
          description="API bağlantısını kontrol edip tekrar dene."
          action={
            <button
              type="button"
              className="text-accent font-semibold hover:underline"
              onClick={() => void refetch()}
            >
              Tekrar dene
            </button>
          }
        />
      )}
      {!isLoading && !isError && (
        <div className="divide-y divide-border">
          {filtered.map((orbit) => (
            <Link
              key={orbit.id}
              href={`/orbits/${orbit.slug}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-bg-hover transition-colors group"
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0",
                  "bg-gradient-to-br from-orbit/30 to-accent/20 border border-orbit/30",
                  "text-orbit font-extrabold text-xl group-hover:scale-105 transition-transform",
                )}
              >
                {orbit.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[17px]">{orbit.name}</p>
                <p className="text-text-secondary text-[15px]">@{orbit.slug}</p>
                {orbit.description && (
                  <p className="text-text-secondary text-[14px] mt-1 line-clamp-2">
                    {orbit.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-text-secondary text-[13px] shrink-0">
                <Users className="h-4 w-4" />
                {orbit.stats.memberCount}
              </div>
            </Link>
          ))}
        </div>
      )}
      {!isLoading && !isError && !filtered.length && (
        <EmptyState
          icon={Sparkles}
          title={q ? "Sonuç bulunamadı" : "Henüz orbit yok"}
          description={
            q
              ? "Farklı bir arama dene."
              : "API başlatıldığında varsayılan orbit'ler otomatik oluşur."
          }
        />
      )}
    </>
  );
}
