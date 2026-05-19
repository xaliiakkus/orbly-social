import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";

export default function OrbitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
  });

  const filtered = useMemo(() => {
    const items = list.data?.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (o) => o.name.toLowerCase().includes(term) || o.slug.toLowerCase().includes(term),
    );
  }, [list.data, q]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={22} color={OrblyColors.textPrimary} />
        </Pressable>
        <Text style={styles.barTitle}>Orbit&apos;ler</Text>
        <View style={{ width: 22 }} />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Orbit ara…"
        placeholderTextColor={OrblyColors.textSecondary}
        value={q}
        onChangeText={setQ}
      />

      {list.isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={OrblyColors.accent} />
      ) : list.isError ? (
        <EmptyState
          title="Orbit'ler yüklenemedi"
          description={formatUserError(list.error)}
          icon="star"
          actionLabel="Tekrar dene"
          onAction={() => void list.refetch()}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/orbits/${item.slug}`)}
            >
              <View style={styles.orbitIcon}>
                <Text style={styles.orbitLetter}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.orbitName}>{item.name}</Text>
                <Text style={styles.orbitSlug}>@{item.slug}</Text>
                {item.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.members}>
                <FontAwesome name="users" size={12} /> {formatCount(item.stats.memberCount)}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title={q.trim() ? "Eşleşen orbit yok" : "Henüz orbit yok"}
              icon="star"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  barTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: OrblyColors.textPrimary },
  search: {
    margin: 12,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  orbitIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(120,86,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitLetter: { fontSize: 20, fontWeight: "800", color: OrblyColors.orbit },
  meta: { flex: 1, minWidth: 0 },
  orbitName: { fontSize: 17, fontWeight: "700", color: OrblyColors.textPrimary },
  orbitSlug: { fontSize: 14, color: OrblyColors.orbit, marginTop: 2 },
  desc: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 6 },
  members: { color: OrblyColors.textSecondary, fontSize: 13 },
});
