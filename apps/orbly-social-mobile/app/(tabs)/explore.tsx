import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ExploreFeaturedCard } from "@/components/explore/ExploreFeaturedCard";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { ExploreScrollTabs } from "@/components/explore/ExploreScrollTabs";
import { ExplorePostsFeed } from "@/components/explore/ExplorePostsFeed";
import { ExploreTrendRow, trendMetaLine } from "@/components/explore/ExploreTrendRow";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { MenuDrawer } from "@/components/MenuDrawer";
import { PostCard } from "@/components/PostCard";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

const EXPLORE_TABS = [
  { id: "for-you" as const, label: "Sana Özel" },
  { id: "trending" as const, label: "Gündemdekiler" },
  { id: "news" as const, label: "Haberler" },
  { id: "sports" as const, label: "Spor" },
  { id: "fun" as const, label: "Eğlence" },
];

type ExploreTab = (typeof EXPLORE_TABS)[number]["id"];

export default function ExploreScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [tab, setTab] = useState<ExploreTab>("for-you");
  const [menuOpen, setMenuOpen] = useState(false);

  const runSearch = useCallback(() => {
    const term = q.trim();
    if (term.length < 2) return;
    setSubmitted(term);
  }, [q]);

  const clearSearch = useCallback(() => {
    setSubmitted("");
    setQ("");
  }, []);

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

  const trendingItems = useMemo(() => trending.data?.data ?? [], [trending.data]);

  const header = (
    <ExploreHeader
      query={q}
      onChangeQuery={setQ}
      onSubmitSearch={runSearch}
      onOpenMenu={() => setMenuOpen(true)}
      onOpenSettings={() => router.push("/settings")}
      searchMode={submitted.length >= 2}
      onBack={clearSearch}
    />
  );

  if (submitted.length >= 2) {
    return (
      <TabScaffold>
        <View style={styles.container}>
          {header}
          {search.isLoading ? (
            <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
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
              ListEmptyComponent={<EmptyState title="Sonuç bulunamadı" icon="search" />}
            />
          )}
        </View>
        <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </TabScaffold>
    );
  }

  const tabsBar = (
    <ExploreScrollTabs tabs={EXPLORE_TABS} active={tab} onChange={setTab} />
  );

  const renderExploreFeed = (showFeatured: boolean) => {
    const feedTab = tab === "trending" ? "trending" : "for-you";
    const listHeader = (
      <>
        {tabsBar}
        {showFeatured ? (
          <ExploreFeaturedCard onPress={() => router.push("/orbits")} />
        ) : null}
        {trending.isLoading ? (
          <ActivityIndicator color={OrblyColors.accent} style={styles.loader} />
        ) : null}
        {trending.isError ? (
          <EmptyState
            title="Gündem yüklenemedi"
            description={formatUserError(trending.error)}
            onAction={() => void trending.refetch()}
            actionLabel="Tekrar dene"
          />
        ) : null}
        {!trending.isLoading && !trending.isError
          ? trendingItems.map((item) => (
              <ExploreTrendRow
                key={item.tag}
                title={item.tag.startsWith("#") ? item.tag : `#${item.tag}`}
                meta={trendMetaLine(item.count)}
                onPress={() => router.push(`/hashtag/${encodeURIComponent(item.tag)}`)}
              />
            ))
          : null}
      </>
    );

    return (
      <ExplorePostsFeed
        tab={feedTab}
        ListHeaderComponent={listHeader}
      />
    );
  };

  const renderTabBody = () => {
    if (tab === "for-you" || tab === "trending") {
      return renderExploreFeed(tab === "for-you");
    }

    const placeholderLabel =
      tab === "news" ? "Haberler" : tab === "sports" ? "Spor" : "Eğlence";

    return (
      <FlatList
        style={styles.list}
        data={[] as { id: string }[]}
        keyExtractor={() => "empty"}
        renderItem={() => null}
        ListHeaderComponent={tabsBar}
        ListEmptyComponent={
          <EmptyState
            title={`${placeholderLabel} yakında`}
            description="Bu kategori için özel gündem listesi üzerinde çalışıyoruz."
          />
        }
      />
    );
  };

  return (
    <TabScaffold>
      <View style={[styles.container, styles.flex]}>
        {header}
        <View style={styles.flex}>{renderTabBody()}</View>
      </View>
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </TabScaffold>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  flex: { flex: 1 },
  list: { flex: 1 },
  loader: { marginVertical: 32 },
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  orbitMeta: { flex: 1, minWidth: 0 },
  members: { color: OrblyColors.textSecondary, fontSize: 13 },
});
