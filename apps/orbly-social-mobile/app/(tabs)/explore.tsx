import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { PostCard } from "@/components/PostCard";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");

  const runSearch = useCallback(() => {
    const term = q.trim();
    if (term.length < 2) return;
    setSubmitted(term);
  }, [q]);

  const search = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => api.search.query(submitted),
    enabled: submitted.length >= 2,
  });

  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.feed.trending(),
    enabled: !submitted,
  });

  const orbits = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
    enabled: !submitted,
  });

  if (submitted.length >= 2) {
    return (
      <TabScaffold>
        <View style={styles.container}>
          <View style={[styles.searchRow, { paddingTop: insets.top + 8 }]}>
          <TextInput
            style={styles.search}
            placeholder="Ara (min. 2 karakter)"
            placeholderTextColor={OrblyColors.textSecondary}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={runSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={runSearch}>
            <Text style={styles.searchBtnText}>Ara</Text>
          </Pressable>
          </View>
          <Pressable onPress={() => { setSubmitted(""); setQ(""); }}>
            <Text style={styles.clear}>Aramayı temizle</Text>
          </Pressable>
          {search.isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
        ) : search.isError ? (
          <EmptyState
            title="Arama başarısız"
            description={formatUserError(search.error)}
            onAction={() => void search.refetch()}
            actionLabel="Tekrar dene"
          />
        ) : (
          <FlatList
            data={[
              ...(search.data?.users.map((u) => ({ type: "user" as const, user: u })) ?? []),
              ...(search.data?.orbits.map((o) => ({ type: "orbit" as const, orbit: o })) ?? []),
              ...(search.data?.posts.map((p) => ({ type: "post" as const, post: p })) ?? []),
            ]}
            keyExtractor={(item, i) =>
              item.type === "user"
                ? `u-${item.user.id}`
                : item.type === "orbit"
                  ? `o-${item.orbit.id}`
                  : `p-${item.post.id}-${i}`
            }
            renderItem={({ item }) => {
              if (item.type === "user") {
                return (
                  <Pressable
                    style={styles.userRow}
                    onPress={() => router.push(`/profile/${item.user.username}`)}
                  >
                    <View style={styles.avatar}>
                      {item.user.avatarUrl ? (
                        <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarLetter}>
                          {item.user.displayName.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.rowTitle}>{item.user.displayName}</Text>
                      <Text style={styles.rowSub}>@{item.user.username}</Text>
                    </View>
                  </Pressable>
                );
              }
              if (item.type === "orbit") {
                return (
                  <Pressable
                    style={styles.userRow}
                    onPress={() => router.push(`/orbits/${item.orbit.slug}`)}
                  >
                    <View style={styles.orbitIcon}>
                      <Text style={styles.orbitLetter}>{item.orbit.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.rowTitle}>{item.orbit.name}</Text>
                      <Text style={styles.rowSub}>@{item.orbit.slug}</Text>
                    </View>
                  </Pressable>
                );
              }
              return <PostCard post={item.post} />;
            }}
            ListEmptyComponent={
              <EmptyState title="Sonuç bulunamadı" icon="search" />
            }
          />
          )}
        </View>
      </TabScaffold>
    );
  }

  return (
    <TabScaffold>
      <View style={styles.container}>
        <View style={[styles.searchRow, { paddingTop: insets.top + 8 }]}>
        <FontAwesome
          name="search"
          size={16}
          color={OrblyColors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.search}
          placeholder="Kullanıcı, gönderi veya orbit ara"
          placeholderTextColor={OrblyColors.textSecondary}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        </View>

        <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.section}>
              <FontAwesome name="line-chart" size={16} color={OrblyColors.accent} /> Gündemde
            </Text>
            {trending.isLoading && (
              <ActivityIndicator color={OrblyColors.accent} style={{ marginVertical: 16 }} />
            )}
          </>
        }
        data={trending.data?.data ?? []}
        keyExtractor={(item) => item.tag}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.trendRow}
            onPress={() => router.push(`/hashtag/${encodeURIComponent(item.tag)}`)}
          >
            <Text style={styles.trendMeta}>{index + 1} · Trend</Text>
            <Text style={styles.trendTag}>#{item.tag}</Text>
            <Text style={styles.trendMeta}>{formatCount(item.count)} gönderi</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <>
            <Text style={[styles.section, styles.sectionTop]}>
              <FontAwesome name="star" size={16} color={OrblyColors.orbit} /> Orbit&apos;ler
            </Text>
            {orbits.isLoading ? (
              <ActivityIndicator color={OrblyColors.accent} />
            ) : (
              orbits.data?.data.map((o) => (
                <Pressable
                  key={o.id}
                  style={styles.orbitRow}
                  onPress={() => router.push(`/orbits/${o.slug}`)}
                >
                  <View style={styles.orbitIcon}>
                    <Text style={styles.orbitLetter}>{o.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.orbitMeta}>
                    <Text style={styles.rowTitle}>{o.name}</Text>
                    <Text style={styles.rowSub}>@{o.slug}</Text>
                  </View>
                  <Text style={styles.members}>
                    <FontAwesome name="users" size={12} /> {o.stats.memberCount}
                  </Text>
                </Pressable>
              ))
            )}
          </>
        }
        />
      </View>
    </TabScaffold>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  searchRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  searchIcon: { position: "absolute", left: 24, zIndex: 1 },
  search: {
    flex: 1,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 40,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  searchBtn: {
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  clear: { color: OrblyColors.accent, paddingHorizontal: 16, paddingBottom: 8, fontWeight: "600" },
  section: {
    color: OrblyColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: OrblyColors.border, marginTop: 8 },
  trendRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  trendMeta: { color: OrblyColors.textSecondary, fontSize: 13 },
  trendTag: { color: OrblyColors.textPrimary, fontSize: 17, fontWeight: "700" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 44, height: 44 },
  avatarLetter: { fontWeight: "700", color: OrblyColors.textPrimary },
  rowTitle: { fontWeight: "700", color: OrblyColors.textPrimary, fontSize: 16 },
  rowSub: { color: OrblyColors.textSecondary, fontSize: 14 },
  orbitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  orbitIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(120,86,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitLetter: { fontSize: 20, fontWeight: "800", color: OrblyColors.orbit },
  orbitMeta: { flex: 1 },
  members: { color: OrblyColors.textSecondary, fontSize: 13 },
});
