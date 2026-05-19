import type { LiveChannelPublic } from "@orbly/api-client";
import { SOCKET_EVENTS, liveRoom, useLiveChannel } from "@orbly/features";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { mergeLiveChannel } from "@/lib/merge-live-channel";
import { getSocket } from "@/lib/socket";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";

const WEB_BASE = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";
const isExpoGo = Constants.appOwnership === "expo";

type LiveBroadcastProps = {
  channelId: string;
  channel: LiveChannelPublic & { isHost?: boolean };
  isHost: boolean;
  onChannelUpdate: (ch: LiveChannelPublic) => void;
};

export default function LiveChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelId = String(id ?? "");
  const router = useRouter();
  const { data, isLoading } = useLiveChannel(channelId);
  const [channel, setChannel] = useState<(LiveChannelPublic & { isHost?: boolean }) | null>(
    null,
  );
  const [LiveBroadcastView, setLiveBroadcastView] =
    useState<ComponentType<LiveBroadcastProps> | null>(null);
  const [liveKitError, setLiveKitError] = useState<string | null>(null);

  useMobileSocketRooms(channelId ? [liveRoom(channelId)] : []);

  useEffect(() => {
    if (data?.channel) setChannel(data.channel);
  }, [data]);

  useEffect(() => {
    if (isExpoGo) return;
    let cancelled = false;
    void (async () => {
      try {
        await import("@/lib/livekit-globals");
        const mod = await import("@/components/live/LiveBroadcastView");
        if (!cancelled) setLiveBroadcastView(() => mod.LiveBroadcastView);
      } catch (e) {
        if (!cancelled) {
          setLiveKitError(
            e instanceof Error ? e.message : "LiveKit yüklenemedi. Development build gerekir.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getSocketStable = useCallback(() => getSocket(), []);

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
      if (body?.channelId === channelId) router.replace("/(tabs)/live");
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
    if (channel?.status === "ended") router.replace("/(tabs)/live");
  }, [channel?.status, router]);

  const handleChannelUpdate = useCallback((ch: LiveChannelPublic) => {
    setChannel((prev) => (prev ? { ...prev, ...ch } : ch));
  }, []);

  if (isExpoGo) {
    return (
      <ExpoGoFallback
        channel={channel}
        loading={isLoading}
        onOpenWeb={() => void WebBrowser.openBrowserAsync(`${WEB_BASE}/live/${channelId}`)}
      />
    );
  }

  if (isLoading || !channel) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} size="large" />
      </View>
    );
  }

  if (data?.configured === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Canlı yayın kullanılamıyor</Text>
        <Text style={styles.sub}>Sunucuda LiveKit yapılandırılmamış.</Text>
      </View>
    );
  }

  if (liveKitError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Native oda yüklenemedi</Text>
        <Text style={styles.sub}>{liveKitError}</Text>
        <Pressable
          style={styles.webBtn}
          onPress={() => void WebBrowser.openBrowserAsync(`${WEB_BASE}/live/${channelId}`)}
        >
          <Text style={styles.webBtnText}>Web&apos;de aç</Text>
        </Pressable>
      </View>
    );
  }

  if (!LiveBroadcastView) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} size="large" />
        <Text style={styles.sub}>Canlı oda hazırlanıyor…</Text>
      </View>
    );
  }

  const isHost = channel.isHost ?? false;

  return (
    <LiveBroadcastView
      channelId={channelId}
      channel={channel}
      isHost={isHost}
      onChannelUpdate={handleChannelUpdate}
    />
  );
}

function ExpoGoFallback({
  channel,
  loading,
  onOpenWeb,
}: {
  channel: LiveChannelPublic | null;
  loading: boolean;
  onOpenWeb: () => void;
}) {
  return (
    <View style={styles.center}>
      {loading ? (
        <ActivityIndicator color={OrblyColors.accent} />
      ) : (
        <>
          <Text style={styles.title}>{channel?.title ?? "Canlı"}</Text>
          <Text style={styles.sub}>
            Native canlı oda Expo Go ile çalışmaz. Development build kullanın (expo run:ios /
            android) veya web&apos;den katılın.
          </Text>
          <Pressable style={styles.webBtn} onPress={onOpenWeb}>
            <Text style={styles.webBtnText}>Web&apos;de aç</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: OrblyColors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: OrblyColors.textPrimary, textAlign: "center" },
  sub: { color: OrblyColors.textSecondary, textAlign: "center", lineHeight: 22, fontSize: 15 },
  webBtn: {
    marginTop: 16,
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  webBtnText: { color: "#fff", fontWeight: "700" },
});
