import type { LiveBroadcastStats } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { SOCKET_EVENTS } from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function LiveSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelId = String(id ?? "");
  const router = useRouter();
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
    const socket = getSocket();
    if (!socket || !channelId) return;

    const onReplay = (payload: unknown) => {
      const body = payload as { channelId?: string; replayUrl?: string };
      if (body?.channelId === channelId && body.replayUrl) void loadStats();
    };

    socket.on(SOCKET_EVENTS.channelReplay, onReplay);
    socket.on(SOCKET_EVENTS.liveReplay, onReplay);
    return () => {
      socket.off(SOCKET_EVENTS.channelReplay, onReplay);
      socket.off(SOCKET_EVENTS.liveReplay, onReplay);
    };
  }, [channelId, loadStats]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} size="large" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Yayın özeti" />
        <Text style={styles.error}>{error || "Yayın özeti bulunamadı."}</Text>
        <Pressable style={styles.btn} onPress={() => router.replace("/(tabs)/live")}>
          <Text style={styles.btnText}>Canlı listesine dön</Text>
        </Pressable>
      </View>
    );
  }

  const host = stats.host;
  const isSelf = me?.id === host?.id;
  const processing =
    stats.recordingStatus === "processing" || stats.recordingStatus === "recording";

  return (
    <View style={styles.container}>
      <ScreenHeader title="Yayın bitti" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <FontAwesome name="microphone" size={14} color={OrblyColors.like} />
            <Text style={styles.badgeText}>Yayın bitti</Text>
          </View>
          <Text style={styles.title}>{stats.title}</Text>
          {host && (
            <Pressable
              style={styles.hostRow}
              onPress={() => host.username && router.push(`/profile/${host.username}`)}
            >
              {host.avatarUrl ? (
                <Image source={{ uri: host.avatarUrl }} style={styles.hostAvatar} />
              ) : (
                <View style={styles.hostAvatar}>
                  <Text style={styles.hostLetter}>{host.displayName.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.hostName}>{host.displayName}</Text>
            </Pressable>
          )}
        </View>

        {stats.replayUrl ? (
          <Pressable
            style={styles.replayBtn}
            onPress={() => void WebBrowser.openBrowserAsync(stats.replayUrl!)}
          >
            <FontAwesome name="play-circle" size={20} color="#fff" />
            <Text style={styles.replayBtnText}>Tekrarı izle</Text>
          </Pressable>
        ) : processing ? (
          <View style={styles.processing}>
            <ActivityIndicator color={OrblyColors.accent} />
            <Text style={styles.processingTitle}>Video tekrarı hazırlanıyor</Text>
            <Text style={styles.processingSub}>Birkaç dakika sürebilir.</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <StatBox label="Süre" value={stats.durationLabel} />
          <StatBox label="Tepe izleyici" value={stats.peakListeners} />
          <StatBox label="Sohbet" value={stats.totalComments} />
          <StatBox label="Tür" value={stats.mode === "video" ? "Görüntülü" : "Sesli"} />
        </View>

        <Text style={styles.note}>
          {stats.hasReplayVideo
            ? "Yayın tekrarı profilinde ve gönderilerinde görünür."
            : processing
              ? "Özet hazır. Video işlendikten sonra tekrar izlenebilir olacak."
              : "Yayın özeti profiline gönderi olarak eklendi."}
        </Text>

        <View style={styles.actions}>
          {isSelf && host?.username && (
            <Pressable
              style={styles.btn}
              onPress={() => router.push(`/profile/${host.username}`)}
            >
              <Text style={styles.btnText}>Profile git</Text>
            </Pressable>
          )}
          {stats.replayPostId && (
            <Pressable
              style={[styles.btn, styles.btnOutline]}
              onPress={() => router.push(`/post/${stats.replayPostId}`)}
            >
              <Text style={[styles.btnText, styles.btnOutlineText]}>Gönderiyi gör</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={() => router.replace("/(tabs)/live")}
          >
            <Text style={[styles.btnText, styles.btnOutlineText]}>Diğer canlı yayınlar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { alignItems: "center", paddingVertical: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(249,24,128,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: { color: OrblyColors.like, fontWeight: "700", fontSize: 13 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: OrblyColors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hostLetter: { fontWeight: "700", color: OrblyColors.textPrimary },
  hostName: { color: OrblyColors.textSecondary, fontSize: 15 },
  replayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: OrblyColors.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  replayBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  processing: {
    alignItems: "center",
    gap: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  processingTitle: { fontWeight: "700", color: OrblyColors.textPrimary },
  processingSub: { color: OrblyColors.textSecondary, fontSize: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  statLabel: { color: OrblyColors.textSecondary, fontSize: 13 },
  statValue: { color: OrblyColors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 4 },
  note: {
    color: OrblyColors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  actions: { gap: 10, marginTop: 8 },
  btn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: OrblyColors.border },
  btnText: { fontWeight: "700", color: "#000" },
  btnOutlineText: { color: OrblyColors.textPrimary },
  error: { color: OrblyColors.like, textAlign: "center", padding: 24 },
});
