"use client";

import { ControlBar, LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import "@/app/globals-livekit.css";
import type { LiveChannelPublic, LiveJoinResponse, LiveRoomRole } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { SOCKET_EVENTS } from "@orbly/features";
import { ArrowLeft, RefreshCw, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { LiveChatPanel } from "@/components/live/live-chat-panel";
import { LiveSpacePanel } from "@/components/live/live-space-panel";
import { LiveStreamStage } from "@/components/live/live-stream-stage";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { mergeLiveChannel } from "@/lib/merge-live-channel";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";

export function LiveBroadcastView({
  channelId,
  channel,
  isHost,
  onChannelUpdate,
  onListenerCount,
}: {
  channelId: string;
  channel: LiveChannelPublic & { isHost?: boolean };
  isHost: boolean;
  onChannelUpdate?: (ch: LiveChannelPublic) => void;
  onListenerCount?: (n: number) => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const myUserId = useAuthStore((s) => s.user?.id);
  const [connect, setConnect] = useState<LiveJoinResponse | null>(null);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [roomKey, setRoomKey] = useState(0);
  const [disconnected, setDisconnected] = useState(false);
  const endedRef = useRef(false);
  const leftRef = useRef(false);
  const onChannelUpdateRef = useRef(onChannelUpdate);
  const onListenerCountRef = useRef(onListenerCount);

  onChannelUpdateRef.current = onChannelUpdate;
  onListenerCountRef.current = onListenerCount;

  const isSpace = channel.kind === "space";
  const role: LiveRoomRole =
    connect?.livekit.role ?? channel.myRole ?? (isHost ? "host" : "listener");
  const canManageRoom =
    connect?.channel.canManageRoom ?? channel.canManageRoom ?? isHost;
  const canPublish = role === "host" || role === "moderator" || role === "speaker";
  const videoMode = !isSpace && channel.mode === "video";
  const host = channel.host;
  const listenerCount = connect?.channel.listenerCount ?? channel.listenerCount;

  useEffect(() => {
    onListenerCountRef.current?.(listenerCount);
  }, [listenerCount]);

  const applyChannel = useCallback(
    (patch: Partial<LiveChannelPublic> | LiveChannelPublic) => {
      setConnect((prev) => {
        if (!prev) return prev;
        let manage =
          patch.canManageRoom ?? prev.channel.canManageRoom ?? isHost;
        let merged = mergeLiveChannel(prev.channel, patch, manage);

        if (myUserId && patch.speakers) {
          const me = patch.speakers.find((s) => s.userId === myUserId);
          if (me?.role === "moderator") {
            merged = { ...merged, myRole: "moderator", canManageRoom: true };
          } else if (me?.role === "speaker" && merged.myRole === "moderator") {
            merged = {
              ...merged,
              myRole: "speaker",
              canManageRoom: false,
              speakerRequests: undefined,
            };
          } else if (me?.role === "host") {
            merged = { ...merged, myRole: "host", canManageRoom: true, isHost: true };
          }
        }

        onChannelUpdateRef.current?.(merged);
        return { ...prev, channel: merged };
      });
    },
    [isHost, myUserId],
  );

  const fetchToken = useCallback(
    async (opts?: { remountRoom?: boolean }) => {
      try {
        const res = await api.live.token(channelId);
        setConnect(res);
        setError("");
        setDisconnected(false);
        onChannelUpdateRef.current?.(res.channel);
        if (opts?.remountRoom) setRoomKey((k) => k + 1);
        return res;
      } catch (e) {
        setError(formatUserError(e));
        return null;
      }
    },
    [channelId],
  );

  useEffect(() => {
    leftRef.current = false;
    void fetchToken();
    return () => {
      if (leftRef.current || isHost) return;
      leftRef.current = true;
      void api.live.leave(channelId).catch(() => undefined);
    };
  }, [channelId, fetchToken, isHost]);

  useEffect(() => {
    const token = session?.accessToken ?? useAuthStore.getState().accessToken;
    const socket = getSocket(token);
    if (!socket) return;

    const refreshIfMe = (payload: unknown) => {
      const body = payload as { channelId?: string; userId?: string };
      if (body?.channelId !== channelId) return;
      if (body.userId && body.userId !== myUserId) return;
      void fetchToken({ remountRoom: true });
    };

    const onChannelPatch = (payload: unknown) => {
      const ch = payload as Partial<LiveChannelPublic> & { id?: string };
      if (ch?.id && ch.id !== channelId) return;
      applyChannel(ch);
    };

    const onSpeakers = (payload: unknown) => {
      const body = payload as {
        channelId?: string;
        speakers?: LiveChannelPublic["speakers"];
        speakerRequests?: LiveChannelPublic["speakerRequests"];
        speakerCount?: number;
      };
      if (body?.channelId !== channelId) return;
      applyChannel({
        speakers: body.speakers,
        speakerRequests: body.speakerRequests,
        speakerCount: body.speakerCount,
      });
    };

    socket.on(SOCKET_EVENTS.liveSpeakerGranted, refreshIfMe);
    socket.on(SOCKET_EVENTS.liveSpeakerRevoked, refreshIfMe);
    socket.on(SOCKET_EVENTS.channelSpeakers, onSpeakers);
    socket.on(SOCKET_EVENTS.channelUpdate, onChannelPatch);

    return () => {
      socket.off(SOCKET_EVENTS.liveSpeakerGranted, refreshIfMe);
      socket.off(SOCKET_EVENTS.liveSpeakerRevoked, refreshIfMe);
      socket.off(SOCKET_EVENTS.channelSpeakers, onSpeakers);
      socket.off(SOCKET_EVENTS.channelUpdate, onChannelPatch);
    };
  }, [channelId, fetchToken, myUserId, applyChannel, isHost, session?.accessToken]);

  const leaveRoom = useCallback(() => {
    leftRef.current = true;
    if (!isHost) void api.live.leave(channelId).catch(() => undefined);
    router.push("/live");
  }, [channelId, isHost, router]);

  const endLive = async () => {
    if (ending || endedRef.current) return;
    endedRef.current = true;
    leftRef.current = true;
    setEnding(true);
    try {
      const res = await api.live.end(channelId);
      router.push(`/live/${res.stats?.channelId ?? channelId}/ozet`);
    } catch (e) {
      setError(formatUserError(e));
      endedRef.current = false;
      leftRef.current = false;
      setEnding(false);
    }
  };

  const handleChannelPatch = (ch: LiveChannelPublic) => {
    applyChannel(ch);
  };

  if (error && !connect) {
    return (
      <div className="p-10 text-center">
        <p className="text-like mb-4">{error}</p>
        <button
          type="button"
          onClick={() => void fetchToken()}
          className="text-accent font-bold hover:underline"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (!connect?.livekit?.token) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-text-secondary">
        {isSpace ? "Odaya bağlanılıyor…" : "Yayına bağlanılıyor…"}
      </div>
    );
  }

  if (disconnected && !isHost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <p className="text-lg font-bold">Bağlantı koptu</p>
        <p className="text-text-secondary text-[15px]">
          Ağ kesintisi veya sekme değişimi olabilir. Yeniden bağlanabilirsin.
        </p>
        <button
          type="button"
          onClick={() => void fetchToken({ remountRoom: true })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          Yeniden bağlan
        </button>
        <button
          type="button"
          onClick={leaveRoom}
          className="text-text-secondary text-[15px] hover:underline"
        >
          Odadan ayrıl
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] md:min-h-screen max-md:-mx-px">
      <header className="flex items-center gap-3 px-3 py-2 border-b border-border bg-bg-primary shrink-0">
        <Link
          href="/live"
          onClick={() => {
            leftRef.current = true;
            if (!isHost) void api.live.leave(channelId).catch(() => undefined);
          }}
          className="p-2 rounded-full hover:bg-bg-hover shrink-0"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar src={host?.avatarUrl} name={host?.displayName ?? "?"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate text-[15px]">{channel.title}</p>
          <p className="text-text-secondary text-xs truncate">
            {isSpace ? "Sohbet odası · " : ""}
            {host?.displayName}
            {isHost
              ? " · Sen yönetiyorsun"
              : role === "moderator"
                ? " · Oda yöneticisi"
                : canPublish
                  ? " · Konuşmacı"
                  : ` · ${listenerCount} dinleyici`}
          </p>
        </div>
        {isHost && (
          <button
            type="button"
            onClick={() => void endLive()}
            disabled={ending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-like text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            {isSpace ? "Odayı kapat" : "Yayını bitir"}
          </button>
        )}
      </header>

      {isSpace && (
        <LiveSpacePanel
          channelId={channelId}
          channel={connect.channel}
          onChannelUpdate={handleChannelPatch}
        />
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-black">
          <LiveKitRoom
            key={roomKey}
            token={connect.livekit.token}
            serverUrl={connect.livekit.url}
            connect={!disconnected}
            audio={canPublish}
            video={canPublish && videoMode}
            onDisconnected={() => {
              if (endedRef.current) return;
              if (isHost) {
                setDisconnected(true);
                return;
              }
              setDisconnected(true);
            }}
            className="flex flex-col flex-1 min-h-0"
            data-lk-theme="default"
          >
            <RoomAudioRenderer />
            <LiveStreamStage
              isHost={isHost}
              isSpace={isSpace}
              videoMode={videoMode}
              channelTitle={channel.title}
              listenerCount={listenerCount}
              speakerCount={channel.speakerCount}
            />
            {canPublish ? (
              <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 [&_.lk-control-bar]:bg-transparent">
                <ControlBar
                  variation="verbose"
                  controls={{
                    microphone: true,
                    camera: videoMode,
                    screenShare: isHost && videoMode,
                    leave: false,
                  }}
                />
              </div>
            ) : (
              <div className="p-3 bg-bg-primary border-t border-border flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="px-6 py-2 rounded-full border border-border font-bold hover:bg-bg-hover text-[15px]"
                >
                  Odadan ayrıl
                </button>
              </div>
            )}
          </LiveKitRoom>
        </div>

        <LiveChatPanel
          channelId={channelId}
          isHost={isHost}
          canManageRoom={canManageRoom}
          isSpace={isSpace}
          onInviteSpeaker={
            canManageRoom && isSpace
              ? (userId) => void api.live.inviteSpeaker(channelId, userId)
              : undefined
          }
        />
      </div>

      {disconnected && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm w-full rounded-2xl bg-bg-primary border border-border p-6 text-center">
            <p className="text-lg font-bold">Yayın bağlantısı koptu</p>
            <p className="text-text-secondary text-[15px] mt-2">
              İzleyiciler seni duymuyor olabilir. Yeniden bağlan veya yayını bitir.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => void fetchToken({ remountRoom: true })}
                className="w-full py-2.5 rounded-full bg-accent text-white font-bold"
              >
                Yeniden bağlan
              </button>
              <button
                type="button"
                onClick={() => void endLive()}
                className="w-full py-2.5 rounded-full border border-border font-bold"
              >
                Yayını bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
