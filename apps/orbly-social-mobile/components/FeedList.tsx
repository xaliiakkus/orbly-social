import { formatUserError } from "@orbly/api-client";
import { useFeed, type FeedMode } from "@orbly/features";
import type { ReactNode } from "react";
import { forwardRef, memo, useCallback, useMemo, useRef } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import { PostCard } from "@/components/PostCard";
import { OrblyColors } from "@/constants/Colors";
import type { PostPublic } from "@orbly/types";

type Props = {
  mode: FeedMode;
  feedBanner?: boolean;
  onRefreshBanner?: () => void;
  ListHeaderComponent?: ReactNode;
};

const FeedPostRow = memo(function FeedPostRow({
  post,
  onRefresh,
}: {
  post: PostPublic;
  onRefresh: () => void;
}) {
  return <PostCard post={post} onRefresh={onRefresh} />;
});

function feedRowKey(post: PostPublic): string {
  return [
    post.id,
    post.stats.likeCount,
    post.stats.replyCount,
    post.stats.repostCount,
    post.likedByMe ? 1 : 0,
    post.repostedByMe ? 1 : 0,
    post.bookmarkedByMe ? 1 : 0,
    post.content.length,
  ].join(":");
}

export const FeedList = forwardRef<FlatListType<PostPublic>, Props>(function FeedList(
  { mode, feedBanner, onRefreshBanner, ListHeaderComponent },
  ref,
) {
  const query = useFeed(mode);
  const posts: PostPublic[] = query.data?.pages.flatMap((p) => p.data) ?? [];
  const listVersion = useMemo(() => posts.map(feedRowKey).join("|"), [posts]);
  const refreshRef = useRef(() => {
    onRefreshBanner?.();
    void query.refetch();
  });
  refreshRef.current = () => {
    onRefreshBanner?.();
    void query.refetch();
  };

  const refresh = useCallback(() => {
    refreshRef.current();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PostPublic }) => (
      <FeedPostRow post={item} onRefresh={() => refreshRef.current()} />
    ),
    [],
  );

  const keyExtractor = useCallback((p: PostPublic) => p.id, []);

  if (query.isLoading) {
    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <FeedSkeleton rows={5} />
      </View>
    );
  }

  if (query.isError) {
    const detail = formatUserError(query.error);
    const offline =
      detail.includes("Bağlantı kurulamadı") || detail.includes("ulaşılamıyor");

    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <EmptyState
          icon={offline ? "wifi" : "exclamation-circle"}
          title="Akış yüklenemedi"
          description={
            offline
              ? "Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene."
              : detail
          }
          actionLabel="Tekrar dene"
          onAction={() => void query.refetch()}
        />
      </View>
    );
  }

  return (
    <FlatList
      ref={ref}
      style={styles.flex}
      data={posts}
      extraData={listVersion}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={6}
      windowSize={7}
      updateCellsBatchingPeriod={50}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          {feedBanner && onRefreshBanner ? (
            <Pressable
              style={styles.banner}
              onPress={() => {
                onRefreshBanner();
                void query.refetch();
              }}
            >
              <Text style={styles.bannerText}>Yeni gönderileri göster</Text>
            </Pressable>
          ) : null}
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isFetchingNextPage}
          onRefresh={refresh}
          tintColor={OrblyColors.accent}
        />
      }
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        <EmptyState
          icon="home"
          title="Henüz gönderi yok"
          description={
            mode === "following"
              ? "Takip ettiğin kişilerin gönderileri burada görünür."
              : "İlk gönderiyi sen paylaş veya keşfet sekmesine göz at."
          }
        />
      }
      contentContainerStyle={posts.length === 0 ? styles.emptyGrow : { paddingBottom: 100 }}
    />
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyGrow: { flexGrow: 1 },
  banner: {
    backgroundColor: OrblyColors.accent,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  bannerText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
