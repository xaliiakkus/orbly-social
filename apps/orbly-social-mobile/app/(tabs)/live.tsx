import { useLiveList } from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GoLiveModal } from "@/components/GoLiveModal";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { StartSpaceModal } from "@/components/StartSpaceModal";
import { TabPageHeader } from "@/components/ui/TabPageHeader";
import { OrblyColors } from "@/constants/Colors";
import type { LiveChannelPublic } from "@orbly/api-client";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  actions: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: OrblyColors.border },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionPrimary: { backgroundColor: OrblyColors.accent, borderColor: OrblyColors.accent },
  actionText: { fontWeight: "700", color: OrblyColors.textPrimary },
  actionPrimaryText: { fontWeight: "700", color: "#fff" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 18 },
  liveDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: OrblyColors.like,
    borderWidth: 2,
    borderColor: OrblyColors.bgPrimary,
  },
  meta: { flex: 1, minWidth: 0 },
  title: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 16 },
  sub: { color: OrblyColors.textSecondary, fontSize: 14, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, alignItems: "center" },
  badge: {
    color: OrblyColors.accent,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(29,155,240,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  listeners: { color: OrblyColors.textSecondary, fontSize: 12 },
  live: { color: OrblyColors.like, fontSize: 12, fontWeight: "700" },
  emptyTitle: { color: OrblyColors.textPrimary, fontSize: 18, fontWeight: "700" },
  muted: { color: OrblyColors.textSecondary, textAlign: "center", fontSize: 15 },
});

function LiveRow({ channel }: { channel: LiveChannelPublic }) {
  const router = useRouter();
  const host = channel.host;
  const isSpace = channel.kind === "space";

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/live/${channel.id}`)}>
      <View style={styles.avatarWrap}>
        {host?.avatarUrl ? (
          <Image source={{ uri: host.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{host?.displayName?.charAt(0) ?? "?"}</Text>
          </View>
        )}
        <View style={styles.liveDot} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {channel.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {host?.displayName ?? host?.username ?? "Host"}
        </Text>
        <View style={styles.badges}>
          <Text style={styles.badge}>{isSpace ? "Sohbet" : channel.mode === "video" ? "Görüntülü" : "Sesli"}</Text>
          <Text style={styles.listeners}>{channel.listenerCount ?? 0} dinleyici</Text>
          <Text style={styles.live}>CANLI</Text>
        </View>
      </View>
      <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
    </Pressable>
  );
}

export default function LiveTabScreen() {
  const { data, isLoading } = useLiveList();
  const channels = data?.data ?? [];
  const liveAvailable = data?.configured !== false;
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);

  if (isLoading) {
    return (
      <TabScaffold>
        <View style={styles.container}>
          <TabPageHeader title="Canlı" />
          <View style={styles.center}>
            <ActivityIndicator color={OrblyColors.accent} />
          </View>
        </View>
      </TabScaffold>
    );
  }

  return (
    <TabScaffold>
      <View style={styles.container}>
        <TabPageHeader title="Canlı" />
        {liveAvailable && (
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => setSpaceOpen(true)}>
            <Text style={styles.actionText}>Oda aç</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionPrimary]} onPress={() => setGoLiveOpen(true)}>
            <Text style={styles.actionPrimaryText}>Yayın aç</Text>
          </Pressable>
        </View>
        )}

        {!liveAvailable ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Canlı yayın şu an kullanılamıyor.</Text>
        </View>
      ) : channels.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome name="microphone" size={40} color={OrblyColors.textSecondary} />
          <Text style={styles.emptyTitle}>Şu an canlı yayın yok</Text>
          <Text style={styles.muted}>İlk sen başlat.</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <LiveRow channel={item} />}
        />
      )}

        <GoLiveModal visible={goLiveOpen} onClose={() => setGoLiveOpen(false)} liveAvailable={liveAvailable} />
        <StartSpaceModal visible={spaceOpen} onClose={() => setSpaceOpen(false)} liveAvailable={liveAvailable} />
      </View>
    </TabScaffold>
  );
}
