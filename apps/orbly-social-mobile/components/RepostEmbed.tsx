import type { PostPublic } from "@orbly/types";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PollBlock } from "@/components/PollBlock";
import { PostContent } from "@/components/ui/PostContent";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Image } from "@/components/ui/expo-image";
import { OrblyColors } from "@/constants/Colors";
import { formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";

export function RepostEmbed({
  post,
  onRefresh,
}: {
  post: PostPublic;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const firstMedia = post.mediaUrls[0];

  return (
    <Pressable
      style={styles.wrap}
      onPress={(e) => {
        e.stopPropagation?.();
        router.push(`/post/${post.id}`);
      }}
    >
      <View style={styles.head}>
        <UserAvatar name={post.author.displayName} uri={post.author.avatarUrl} size="sm" />
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>
            {post.author.displayName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            @{post.author.username} · {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>
      {post.content.trim() ? (
        <View style={styles.content}>
          <PostContent content={post.content} />
        </View>
      ) : null}
      {post.poll ? (
        <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
      ) : null}
      {firstMedia ? (
        <Image
          source={{ uri: resolveMediaUrl(firstMedia) ?? firstMedia }}
          style={styles.media}
          contentFit="cover"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    borderRadius: 16,
    overflow: "hidden",
    padding: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  headText: { flex: 1, minWidth: 0 },
  name: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 15 },
  meta: { color: OrblyColors.textSecondary, fontSize: 14, marginTop: 1 },
  content: { marginTop: 6 },
  media: { marginTop: 8, width: "100%", height: 160, borderRadius: 12 },
});
