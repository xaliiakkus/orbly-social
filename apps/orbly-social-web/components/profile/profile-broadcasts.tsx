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

function BroadcastCard({ stats }: { stats: LiveBroadcastStats }) {
  return (
    <Link
      href={`/live/${stats.channelId}/ozet`}
      className="block p-4 border-b border-border hover:bg-bg-hover/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-like/15 flex items-center justify-center shrink-0">
          <Radio className="h-6 w-6 text-like" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{stats.title}</p>
          <p className="text-text-secondary text-sm mt-0.5">
            {stats.mode === "video" ? "Görüntülü" : "Sesli"} · {stats.durationLabel}
            {stats.endedAt ? ` · ${formatRelativeTime(stats.endedAt)}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-[13px] text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {stats.peakListeners} tepe
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {stats.totalComments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stats.durationLabel}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-accent shrink-0">
          {stats.hasReplayVideo ? "İzle" : "Özet"}
        </span>
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
      <EmptyState
        icon={Radio}
        title="Henüz yayın yok"
        description="Tamamlanan canlı yayınların burada listelenir."
        className="py-16"
      />
    );
  }

  return (
    <div>
      {list.map((b) => (
        <BroadcastCard key={b.channelId} stats={b} />
      ))}
    </div>
  );
}
