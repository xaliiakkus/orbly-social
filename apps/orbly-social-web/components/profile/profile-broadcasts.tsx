"use client";

import type { LiveBroadcastStats } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageCircle, Radio, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

function BroadcastRow({ stats }: { stats: LiveBroadcastStats }) {
  return (
    <Link
      href={`/live/${stats.channelId}/ozet`}
      className="block px-4 py-4 border-b border-border hover:bg-bg-hover/40 transition-colors animate-profile-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-2xl">
          <Radio className="h-6 w-6 text-like" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold truncate">{stats.title}</h3>
            <span className="text-[13px] font-bold text-accent shrink-0">
              {stats.hasReplayVideo ? "İzle" : "Özet"}
            </span>
          </div>
          <p className="text-[14px] text-text-secondary mt-0.5 leading-snug">
            {stats.mode === "video" ? "Görüntülü" : "Sesli"} yayın · {stats.durationLabel}
            {stats.endedAt ? ` · ${formatRelativeTime(stats.endedAt)}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-[13px] text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium text-text-primary tabular-nums">{stats.peakListeners}</span> tepe
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-medium text-text-primary tabular-nums">{stats.totalComments}</span> yorum
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stats.durationLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProfileBroadcasts({ username }: { username: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile-broadcasts", username],
    queryFn: () => api.users.broadcasts(username),
    enabled: !!username,
  });

  if (isLoading) return <PageLoading />;

  if (isError) {
    return (
      <EmptyState
        icon={Radio}
        title="Yayınlar yüklenemedi"
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
        <Radio className="h-10 w-10 text-text-secondary mb-3" />
        <p className="text-[17px] font-bold text-text-primary">Henüz yayın yok</p>
        <p className="text-[15px] text-text-secondary mt-2 max-w-sm">
          Tamamlanan canlı yayınlar burada listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {list.map((b) => (
        <BroadcastRow key={b.channelId} stats={b} />
      ))}
    </div>
  );
}
