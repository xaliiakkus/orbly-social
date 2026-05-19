import type { LiveChannelPublic, LiveJoinResponse, LiveRoomRole } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { LiveKitRoom } from "@livekit/react-native";
import { SOCKET_EVENTS } from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveChatPanel } from "@/components/live/LiveChatPanel";
import { LiveRoomControls } from "@/components/live/LiveRoomControls";
import { LiveRoomStage } from "@/components/live/LiveRoomStage";
import { LiveSpacePanel } from "@/components/live/LiveSpacePanel";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { mergeLiveChannel } from "@/lib/merge-live-channel";
import { getSocket } from "@/lib/socket";

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
  const insets = useSafeAreaInsets();
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
    const socket = getSocket();
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
  }, [channelId, fetchToken, myUserId, applyChannel]);

  const leaveRoom = useCallback(() => {
    leftRef.current = true;
    if (!isHost) void api.live.leave(channelId).catch(() => undefined);
    router.replace("/(tabs)/live");
  }, [channelId, isHost, router]);

  const endLive = async () => {
    if (ending || endedRef.current) return;
    endedRef.current = true;
    leftRef.current = true;
    setEnding(true);
    try {
      const res = await api.live.end(channelId);
      router.replace(`/live/${res.stats?.channelId ?? channelId}/ozet`);
    } catch (e) {
      setError(formatUserError(e));
      endedRef.current = false;
      leftRef.current = false;
      setEnding(false);
    }
  };

  if (error && !connect) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => void fetchToken()}>
          <Text style={styles.retry}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  if (!connect?.livekit?.token) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={OrblyColors.accent} size="large" />
        <Text style={styles.connecting}>
          {isSpace ? "Odaya bağlanılıyor…" : "Yayına bağlanılıyor…"}
        </Text>
      </View>
    );
  }

  if (disconnected && !isHost) {
    return (
      <View style={styles.centered}>
        <Text style={styles.disconnectTitle}>Bağlantı koptu</Text>
        <Text style={styles.disconnectSub}>
          Yeniden bağlanabilir veya odadan ayrılabilirsin.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => void fetchToken({ remountRoom: true })}
        >
          <Text style={styles.primaryBtnText}>Yeniden bağlan</Text>
        </Pressable>
        <Pressable onPress={leaveRoom}>
          <Text style={styles.retry}>Odadan ayrıl</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            leftRef.current = true;
            if (!isHost) void api.live.leave(channelId).catch(() => undefined);
            router.back();
          }}
          hitSlop={12}
        >
          <FontAwesome name="arrow-left" size={22} color={OrblyColors.textPrimary} />
        </Pressable>
        {host?.avatarUrl ? (
          <Image source={{ uri: host.avatarUrl }} style={styles.hostAvatar} />
        ) : (
          <View style={styles.hostAvatar}>
            <Text style={styles.hostLetter}>{(host?.displayName ?? "?").charAt(0)}</Text>
          </View>
        )}
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {channel.title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {isSpace ? "Sohbet · " : ""}
            {host?.displayName}
            {isHost
              ? " · Sen yönetiyorsun"
              : role === "moderator"
                ? " · Yönetici"
                : canPublish
                  ? " · Konuşmacı"
                  : ` · ${listenerCount} dinleyici`}
          </Text>
        </View>
        {isHost && (
          <Pressable
            style={[styles.endBtn, ending && styles.endBtnDisabled]}
            disabled={ending}
            onPress={() => void endLive()}
          >
            <Text style={styles.endBtnText}>{isSpace ? "Kapat" : "Bitir"}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isSpace && connect && (
          <LiveSpacePanel
            channelId={channelId}
            channel={connect.channel}
            onChannelUpdate={(ch) => applyChannel(ch)}
          />
        )}

        <View style={styles.roomArea}>
          <LiveKitRoom
            key={roomKey}
            token={connect.livekit.token}
            serverUrl={connect.livekit.url}
            connect={!disconnected}
            audio={canPublish}
            video={canPublish && videoMode}
            onDisconnected={() => {
              if (endedRef.current) return;
              setDisconnected(true);
            }}
          >
            <LiveRoomStage
              isHost={isHost}
              isSpace={isSpace}
              videoMode={videoMode}
              channelTitle={channel.title}
              listenerCount={listenerCount}
              speakerCount={channel.speakerCount}
            />
            {canPublish ? (
              <LiveRoomControls videoMode={videoMode} isHost={isHost} onLeave={leaveRoom} />
            ) : (
              <Pressable style={styles.leaveListener} onPress={leaveRoom}>
                <Text style={styles.leaveListenerText}>Odadan ayrıl</Text>
              </Pressable>
            )}
          </LiveKitRoom>
        </View>

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
      </ScrollView>

      <Modal visible={disconnected && isHost} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.disconnectTitle}>Yayın bağlantısı koptu</Text>
            <Text style={styles.disconnectSub}>
              İzleyiciler seni duymuyor olabilir.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void fetchToken({ remountRoom: true })}
            >
              <Text style={styles.primaryBtnText}>Yeniden bağlan</Text>
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={() => void endLive()}>
              <Text style={styles.outlineBtnText}>Yayını bitir</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hostLetter: { fontWeight: "700", color: OrblyColors.textPrimary },
  headerMeta: { flex: 1, minWidth: 0 },
  headerTitle: { fontWeight: "700", fontSize: 15, color: OrblyColors.textPrimary },
  headerSub: { fontSize: 12, color: OrblyColors.textSecondary, marginTop: 2 },
  endBtn: {
    backgroundColor: OrblyColors.like,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  endBtnDisabled: { opacity: 0.5 },
  endBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  roomArea: { minHeight: 280 },
  leaveListener: {
    padding: 14,
    alignItems: "center",
    backgroundColor: OrblyColors.bgPrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
  },
  leaveListenerText: { fontWeight: "700", color: OrblyColors.textPrimary },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  connecting: { color: OrblyColors.textSecondary, marginTop: 12 },
  errorText: { color: OrblyColors.like, textAlign: "center" },
  retry: { color: OrblyColors.accent, fontWeight: "700" },
  disconnectTitle: { fontSize: 18, fontWeight: "800", color: OrblyColors.textPrimary },
  disconnectSub: {
    color: OrblyColors.textSecondary,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  outlineBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  outlineBtnText: { fontWeight: "700", color: OrblyColors.textPrimary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: OrblyColors.bgPrimary,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
});
