import type { LiveChannelPublic } from "@orbly/api-client";
import { useLiveList } from "@orbly/features";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";

function SpacePill({ channel }: { channel: LiveChannelPublic }) {
  const router = useRouter();
  const host = channel.host;
  const listeners = channel.listenerCount ?? 0;
  const speakers = channel.speakers?.slice(0, 3).map((s) => s.user).filter(Boolean) ?? [];
  const faces = speakers.length > 0 ? speakers : host ? [host] : [];

  return (
    <Pressable
      style={styles.pill}
      onPress={() => router.push(`/live/${channel.id}`)}
    >
      <Text style={styles.wave}>〰️</Text>
      <View style={styles.faces}>
        {faces.map((u, i) => (
          <View key={u!.id} style={[styles.face, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
            {u!.avatarUrl ? (
              <Image source={{ uri: u!.avatarUrl }} style={styles.faceImg} />
            ) : (
              <Text style={styles.faceLetter}>{(u!.displayName ?? "?").charAt(0)}</Text>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.pillTitle} numberOfLines={1}>
        {listeners > 0 ? `+${listeners} · ` : ""}
        {channel.title}
      </Text>
      <Text style={styles.wave}>〰️</Text>
    </Pressable>
  );
}

export function SpacesBanner() {
  const { data, isLoading } = useLiveList();
  const spaces = useMemo(
    () => (data?.data ?? []).filter((ch) => ch.kind === "space" && ch.status === "live"),
    [data?.data],
  );

  if (isLoading || spaces.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {spaces.map((ch) => (
        <SpacePill key={ch.id} channel={ch} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    maxHeight: 56,
  },
  content: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 280,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: OrblyColors.orbit,
  },
  wave: { fontSize: 12, opacity: 0.9 },
  faces: { flexDirection: "row", alignItems: "center" },
  face: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: OrblyColors.bgTertiary,
    borderWidth: 2,
    borderColor: OrblyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  faceImg: { width: 28, height: 28 },
  faceLetter: { color: "#fff", fontSize: 12, fontWeight: "700" },
  pillTitle: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
});
