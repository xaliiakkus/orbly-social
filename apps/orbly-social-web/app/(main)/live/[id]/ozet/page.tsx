"use client";

import type { LiveBroadcastStats } from "@orbly/api-client";
import { SOCKET_EVENTS } from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import { BarChart3, Clock, Loader2, MessageCircle, Radio, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LiveReplayPlayer } from "@/components/live/live-replay-player";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/page-loading";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-secondary/30 p-4 flex flex-col gap-2">
      <Icon className="h-5 w-5 text-accent" />
      <p className="text-text-secondary text-[13px]">{label}</p>
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

export default function LiveSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = String(params.id ?? "");
  const { data: session } = useSession();
  const me = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<LiveBroadcastStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const res = await api.live.stats(channelId);
    setStats(res.stats);
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    loadStats()
      .catch((e) => setError(formatUserError(e)))
      .finally(() => setLoading(false));
  }, [channelId, loadStats]);

  useEffect(() => {
    if (!channelId || stats?.recordingStatus !== "processing") return;
    const t = setInterval(() => {
      void loadStats().catch(() => undefined);
    }, 5000);
    return () => clearInterval(t);
  }, [channelId, stats?.recordingStatus, loadStats]);

  useEffect(() => {
    const socket = getSocket(session?.accessToken ?? useAuthStore.getState().accessToken);
    if (!socket || !channelId) return;

    const onReplay = (payload: unknown) => {
      const body = payload as { channelId?: string; replayUrl?: string };
      if (body?.channelId === channelId && body.replayUrl) {
        void loadStats();
      }
    };

    socket.on(SOCKET_EVENTS.channelReplay, onReplay);
    socket.on(SOCKET_EVENTS.liveReplay, onReplay);
    return () => {
      socket.off(SOCKET_EVENTS.channelReplay, onReplay);
      socket.off(SOCKET_EVENTS.liveReplay, onReplay);
    };
  }, [channelId, session?.accessToken, loadStats]);

  if (loading) return <PageLoading />;

  if (error || !stats) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-like mb-4">{error || "Yayın özeti bulunamadı."}</p>
        <Button variant="outline" onClick={() => router.push("/live")}>
          Canlı listesine dön
        </Button>
      </div>
    );
  }

  const host = stats.host;
  const isSelf = me?.id === host?.id;
  const profileHref = host?.username ? `/profile/${host.username}` : "/home";
  const processing = stats.recordingStatus === "processing" || stats.recordingStatus === "recording";

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="px-4 py-6 border-b border-border bg-gradient-to-b from-like/10 to-transparent text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-like/15 text-like text-sm font-bold mb-4">
          <Radio className="h-4 w-4" />
          Yayın bitti
        </div>
        <h1 className="text-2xl font-extrabold mb-2">{stats.title}</h1>
        {host && (
          <Link href={profileHref} className="inline-flex items-center gap-2 hover:opacity-80">
            <Avatar src={host.avatarUrl} name={host.displayName} size="sm" />
            <span className="text-text-secondary text-[15px]">{host.displayName}</span>
          </Link>
        )}
      </div>

      {stats.replayUrl ? (
        <div className="p-4 max-w-3xl mx-auto w-full">
          <LiveReplayPlayer src={stats.replayUrl} title={stats.title} />
        </div>
      ) : processing ? (
        <div className="mx-4 my-4 p-6 rounded-xl border border-border bg-bg-secondary/40 flex flex-col items-center gap-2 text-text-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="font-semibold text-text-primary">Video tekrarı hazırlanıyor</p>
          <p className="text-sm">Birkaç dakika sürebilir. Sayfa otomatik güncellenir.</p>
        </div>
      ) : null}

      <div className="p-4 grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        <StatCard icon={Clock} label="Süre" value={stats.durationLabel} />
        <StatCard icon={Users} label="Tepe izleyici" value={stats.peakListeners} />
        <StatCard icon={MessageCircle} label="Sohbet" value={stats.totalComments} />
        <StatCard icon={BarChart3} label="Tür" value={stats.mode === "video" ? "Görüntülü" : "Sesli"} />
      </div>

      <div className="mx-4 mb-6 p-4 rounded-xl border border-border bg-bg-secondary/40 text-center text-[15px] text-text-secondary">
        {stats.hasReplayVideo ? (
          <p>Yayın tekrarı profilinde ve gönderilerinde görünür.</p>
        ) : processing ? (
          <p>Özet hazır. Video işlendikten sonra tekrar izlenebilir olacak.</p>
        ) : (
          <p>
            Yayın özeti profiline gönderi olarak eklendi.
            {isSelf ? " Gönderiler ve Yayınlar sekmesinde görünür." : ""}
          </p>
        )}
      </div>

      <div className="mt-auto p-4 flex flex-col sm:flex-row gap-3 justify-center border-t border-border">
        {isSelf && (
          <Button className="rounded-full font-bold" onClick={() => router.push(profileHref)}>
            Profile git
          </Button>
        )}
        {stats.replayPostId && (
          <Button
            variant="outline"
            className="rounded-full font-bold"
            onClick={() => router.push(`/post/${stats.replayPostId}`)}
          >
            Gönderiyi gör
          </Button>
        )}
        <Button variant="outline" className="rounded-full font-bold" onClick={() => router.push("/live")}>
          Diğer canlı yayınlar
        </Button>
      </div>
    </div>
  );
}
