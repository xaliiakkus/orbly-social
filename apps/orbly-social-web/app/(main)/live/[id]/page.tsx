"use client";

import { SOCKET_EVENTS, liveRoom, useLiveChannel, useSocketRooms } from "@orbly/features";
import type { LiveChannelPublic } from "@orbly/api-client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LiveBroadcastView } from "@/components/live/live-broadcast-view";
import { PageLoading } from "@/components/ui/page-loading";
import { mergeLiveChannel } from "@/lib/merge-live-channel";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

export default function LiveChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = String(params.id ?? "");
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading } = useLiveChannel(channelId);
  const [channel, setChannel] = useState<(LiveChannelPublic & { isHost?: boolean }) | null>(null);

  const getSocketStable = useCallback(() => {
    return getSocket(accessToken);
  }, [accessToken]);

  useSocketRooms(getSocketStable, channelId ? [liveRoom(channelId)] : []);

  useEffect(() => {
    if (data?.channel) setChannel(data.channel);
  }, [data]);

  useEffect(() => {
    const socket = getSocketStable();
    if (!socket || !channelId) return;

    const onUpdate = (payload: unknown) => {
      const ch = payload as Partial<LiveChannelPublic> & { id?: string };
      if (ch?.id && ch.id !== channelId) return;
      setChannel((prev) => {
        if (!prev) return prev;
        const canManage = prev.canManageRoom ?? prev.isHost ?? false;
        return mergeLiveChannel(prev, ch, canManage);
      });
    };

    const onSpeakers = (payload: unknown) => {
      const body = payload as {
        channelId?: string;
        speakers?: LiveChannelPublic["speakers"];
        speakerRequests?: LiveChannelPublic["speakerRequests"];
        speakerCount?: number;
      };
      if (body?.channelId !== channelId) return;
      setChannel((prev) => {
        if (!prev) return prev;
        return mergeLiveChannel(
          prev,
          {
            speakers: body.speakers,
            speakerRequests: body.speakerRequests,
            speakerCount: body.speakerCount,
          },
          prev.canManageRoom ?? prev.isHost ?? false,
        );
      });
    };

    const onEnded = (payload: unknown) => {
      const body = payload as { channelId?: string };
      if (body?.channelId === channelId) router.replace("/live");
    };

    socket.on(SOCKET_EVENTS.channelUpdate, onUpdate);
    socket.on(SOCKET_EVENTS.channelSpeakers, onSpeakers);
    socket.on(SOCKET_EVENTS.channelEnded, onEnded);
    socket.on(SOCKET_EVENTS.liveEnded, onEnded);

    return () => {
      socket.off(SOCKET_EVENTS.channelUpdate, onUpdate);
      socket.off(SOCKET_EVENTS.channelSpeakers, onSpeakers);
      socket.off(SOCKET_EVENTS.channelEnded, onEnded);
      socket.off(SOCKET_EVENTS.liveEnded, onEnded);
    };
  }, [channelId, getSocketStable, router]);

  useEffect(() => {
    if (channel?.status === "ended") router.replace("/live");
  }, [channel?.status, router]);

  const handleChannelUpdate = useCallback((ch: LiveChannelPublic) => {
    setChannel((prev) => (prev ? { ...prev, ...ch } : ch));
  }, []);

  const handleListenerCount = useCallback((n: number) => {
    setChannel((prev) => (prev ? { ...prev, listenerCount: n } : prev));
  }, []);

  if (isLoading || !channel) {
    return <PageLoading />;
  }

  if (data?.configured === false) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-bold">Canlı yayın kullanılamıyor</p>
        <p className="text-text-secondary mt-2 text-[15px]">Şu an bu özellik aktif değil. Daha sonra tekrar dene.</p>
      </div>
    );
  }

  const isHost = channel.isHost ?? false;

  return (
    <LiveBroadcastView
      channelId={channelId}
      channel={channel}
      isHost={isHost}
      onChannelUpdate={handleChannelUpdate}
      onListenerCount={handleListenerCount}
    />
  );
}
