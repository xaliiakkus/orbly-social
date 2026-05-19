import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { PostThread } from "@/components/PostThread";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useReplyCompose } from "@/lib/reply-compose-context";

export default function PostDetailScreen() {
  const { id, replyTo } = useLocalSearchParams<{ id: string; replyTo?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { openReply } = useReplyCompose();
  const openedReplyTo = useRef<string | null>(null);

  const post = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.posts.get(id!),
    enabled: !!id,
  });

  const replies = useQuery({
    queryKey: ["replies", id],
    queryFn: () => api.posts.replies(id!),
    enabled: !!id,
  });

  const replyList = replies.data?.data ?? [];
  const root = post.data?.post;

  useEffect(() => {
    if (!replyTo || !root) return;
    if (openedReplyTo.current === replyTo) return;

    const target =
      replyTo === root.id ? root : replyList.find((r) => r.id === replyTo);
    if (!target) return;

    openedReplyTo.current = replyTo;
    openReply(target);
    router.replace(`/post/${id}`);
  }, [replyTo, root, replyList, id, openReply, router]);

  const refreshThread = () => {
    void qc.invalidateQueries({ queryKey: ["post", id] });
    void qc.invalidateQueries({ queryKey: ["replies", id] });
    void qc.invalidateQueries({ queryKey: ["feed"] });
  };

  if (post.isLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Gönderi" onBack={() => router.back()} />
        <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gönderi" onBack={() => router.back()} />
      <FlatList
        style={styles.list}
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {root ? (
              <PostThread
                rootPost={root}
                replies={replyList}
                onRefresh={refreshThread}
              />
            ) : null}
            {!replies.isLoading && replyList.length === 0 ? (
              <EmptyState title="Henüz yanıt yok" icon="comment-o" />
            ) : null}
          </>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: 8 },
});
