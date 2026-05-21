import { formatUserError } from "@orbly/api-client";
import type { OrbitPublic } from "@orbly/types";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";

function OrbitRow({ orbit, isSelf }: { orbit: OrbitPublic; isSelf?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/orbits/${orbit.slug}`)}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>{orbit.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {orbit.name}
        </Text>
        {orbit.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {orbit.description}
          </Text>
        ) : null}
        <Text style={styles.stats}>
          {formatCount(orbit.stats.memberCount)} üye · {formatCount(orbit.stats.postCount)} gönderi
        </Text>
      </View>
      <Text style={styles.action}>{isSelf ? "Üye" : "Gör"}</Text>
    </Pressable>
  );
}

export function ProfileOrbitsList({
  username,
  isSelf,
}: {
  username: string;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile-orbits", username],
    queryFn: () => api.users.orbits(username),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Orbit'ler yüklenemedi"
        description={formatUserError(error)}
        actionLabel="Tekrar dene"
        onAction={() => void refetch()}
      />
    );
  }

  const list = data?.data ?? [];
  if (!list.length) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>Henüz orbit yok</Text>
        <Text style={styles.placeholderDesc}>
          {isSelf
            ? "Orbit listesinden topluluklara katılabilirsin."
            : "Bu kullanıcı henüz bir orbit'e katılmamış."}
        </Text>
        {isSelf ? (
          <Pressable onPress={() => router.push("/orbits")}>
            <Text style={styles.link}>Orbit'leri keşfet</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {list.map((orbit) => (
        <OrbitRow key={orbit.id} orbit={orbit} isSelf={isSelf} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 32, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(120, 86, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20, fontWeight: "800", color: OrblyColors.orbit },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: "700", color: OrblyColors.textPrimary },
  desc: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4, lineHeight: 18 },
  stats: { fontSize: 13, color: OrblyColors.textSecondary, marginTop: 6 },
  action: { fontSize: 13, fontWeight: "700", color: OrblyColors.accent },
  placeholder: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  placeholderTitle: { fontSize: 17, fontWeight: "700", color: OrblyColors.textPrimary },
  placeholderDesc: {
    fontSize: 15,
    color: OrblyColors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  link: { marginTop: 16, fontSize: 15, fontWeight: "700", color: OrblyColors.accent },
});
