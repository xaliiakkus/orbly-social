import { formatUserError } from "@orbly/api-client";
import { useExploreFeed, type ExploreFeedTab } from "@orbly/features";
import type { PostPublic } from "@orbly/types";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import { PostCard } from "@/components/PostCard";
import { OrblyColors } from "@/constants/Colors";

export function ExplorePostsFeed({
  tab,
  ListHeaderComponent,
}: {
  tab: ExploreFeedTab;
  ListHeaderComponent?: React.ReactElement | null;
}) {
  const query = useExploreFeed(tab);
  const posts: PostPublic[] = query.data?.pages.flatMap((p) => p.data) ?? [];

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  if (query.isLoading && !posts.length) {
    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <FeedSkeleton rows={4} />
      </View>
    );
  }

  if (query.isError && !posts.length) {
    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <EmptyState
          title="Gönderiler yüklenemedi"
          description={formatUserError(query.error)}
          onAction={refresh}
          actionLabel="Tekrar dene"
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <PostCard post={item} onRefresh={refresh} />
      )}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      ListEmptyComponent={
        <EmptyState
          title="Henüz keşfedilecek gönderi yok"
          description="Etkileşim ve yanıtlar arttıkça gönderiler keşfete düşer."
        />
      }
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={refresh} tintColor={OrblyColors.accent} />
      }
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={OrblyColors.accent} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flex: 1 },
  footer: { paddingVertical: 16 },
});
