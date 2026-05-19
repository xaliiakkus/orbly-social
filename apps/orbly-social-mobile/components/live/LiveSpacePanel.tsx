import type { LiveChannelPublic } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { Image } from "@/components/ui/expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

export function LiveSpacePanel({
  channelId,
  channel,
  onChannelUpdate,
}: {
  channelId: string;
  channel: LiveChannelPublic;
  onChannelUpdate: (ch: LiveChannelPublic) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isHost = channel.isHost ?? channel.myRole === "host";
  const canManage = channel.canManageRoom ?? isHost;
  const isModerator = channel.myRole === "moderator";
  const isSpeaker = channel.myRole === "speaker" || isModerator || isHost;
  const isListener = channel.myRole === "listener";

  const run = async (key: string, fn: () => Promise<{ channel: LiveChannelPublic }>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fn();
      onChannelUpdate(res.channel);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setBusy(null);
    }
  };

  const speakers = channel.speakers ?? [];
  const requests = channel.speakerRequests ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>
          Konuşmacılar ({channel.speakerCount ?? speakers.length})
        </Text>
        {isListener && !channel.hasSpeakRequest && (
          <Pressable
            style={styles.accentBtn}
            disabled={!!busy}
            onPress={() => void run("req", () => api.live.requestSpeak(channelId))}
          >
            <Text style={styles.accentBtnText}>Konuşma iste</Text>
          </Pressable>
        )}
        {isListener && channel.hasSpeakRequest && (
          <Pressable
            style={styles.outlineBtn}
            disabled={!!busy}
            onPress={() => void run("cancel", () => api.live.cancelSpeakRequest(channelId))}
          >
            <Text style={styles.outlineBtnText}>İsteği iptal</Text>
          </Pressable>
        )}
        {isModerator && <Text style={styles.roleTag}>Yönetici</Text>}
        {isSpeaker && !isHost && !isModerator && (
          <Text style={styles.roleTagAccent}>Konuşmacısın</Text>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator size="small" color={OrblyColors.accent} /> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {speakers.map((s) => (
          <View key={s.userId} style={styles.chip}>
            {s.user?.avatarUrl ? (
              <Image source={{ uri: s.user.avatarUrl }} style={styles.chipAvatar} />
            ) : (
              <View style={styles.chipAvatar}>
                <Text style={styles.chipLetter}>
                  {(s.user?.displayName ?? "?").charAt(0)}
                </Text>
              </View>
            )}
            <Text style={styles.chipName} numberOfLines={1}>
              {s.user?.displayName ?? "Kullanıcı"}
            </Text>
            <Text style={styles.chipRole}>{s.role}</Text>
            {canManage && s.role === "speaker" && !isHost && s.userId !== channel.host?.id && (
              <Pressable
                onPress={() =>
                  void run(`revoke-${s.userId}`, () =>
                    api.live.revokeSpeaker(channelId, s.userId),
                  )
                }
              >
                <Text style={styles.chipAction}>Kaldır</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      {canManage && requests.length > 0 && (
        <View style={styles.requests}>
          <Text style={styles.requestsTitle}>İstekler ({requests.length})</Text>
          {requests.map((r) => (
            <View key={r.userId} style={styles.requestRow}>
              <Text style={styles.requestName}>{r.user?.displayName ?? r.userId}</Text>
              <Pressable
                style={styles.accentBtn}
                disabled={!!busy}
                onPress={() =>
                  void run(`grant-${r.userId}`, () =>
                    api.live.approveSpeaker(channelId, r.userId),
                  )
                }
              >
                <Text style={styles.accentBtnText}>Onayla</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: OrblyColors.textSecondary,
    textTransform: "uppercase",
    flex: 1,
  },
  accentBtn: {
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  accentBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  outlineBtnText: { fontWeight: "700", fontSize: 12, color: OrblyColors.textPrimary },
  roleTag: { fontSize: 12, fontWeight: "600", color: OrblyColors.orbit },
  roleTagAccent: { fontSize: 12, fontWeight: "600", color: OrblyColors.accent },
  error: { color: OrblyColors.like, fontSize: 12 },
  chips: { flexGrow: 0 },
  chip: {
    alignItems: "center",
    width: 88,
    marginRight: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: OrblyColors.bgPrimary,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  chipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chipLetter: { fontWeight: "700", color: OrblyColors.textPrimary },
  chipName: { fontSize: 12, fontWeight: "600", color: OrblyColors.textPrimary, marginTop: 4 },
  chipRole: { fontSize: 10, color: OrblyColors.textSecondary },
  chipAction: { fontSize: 11, color: OrblyColors.like, marginTop: 4, fontWeight: "600" },
  requests: { gap: 6 },
  requestsTitle: { fontSize: 12, fontWeight: "700", color: OrblyColors.textSecondary },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  requestName: { flex: 1, color: OrblyColors.textPrimary, fontSize: 14 },
});
