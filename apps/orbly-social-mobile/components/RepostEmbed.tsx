import type { PostPublic } from "@orbly/types";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { PollBlock } from "@/components/PollBlock";
import { PostContent } from "@/components/ui/PostContent";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Image } from "@/components/ui/expo-image";
import { createRepostEmbedStyles } from "@/components/post/repost-embed-styles";
import { useThemedStyles } from "@/lib/use-themed-styles";
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
  const styles = useThemedStyles(createRepostEmbedStyles);
  const firstMedia = post.mediaUrls[0];

  return (
    <Pressable
      style={styles.wrap}
      onPress={(e) => {
        e.stopPropagation?.();
        router.push(`/post/${post.id}`);
      }}
    >
      <View style={styles.inner}>
        <View style={styles.head}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/profile/${post.author.username}`);
            }}
          >
            <UserAvatar name={post.author.displayName} uri={post.author.avatarUrl} size="sm" />
          </Pressable>
          <Pressable
            style={styles.headText}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push(`/profile/${post.author.username}`);
            }}
          >
            <View style={styles.nameMetaRow}>
              <Text style={styles.name} numberOfLines={1}>
                {post.author.displayName}
              </Text>
              <Text style={styles.handle} numberOfLines={1}>
                @{post.author.username}
              </Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTime}>{formatRelativeTime(post.createdAt)}</Text>
            </View>
          </Pressable>
        </View>

        {post.content.trim() ? (
          <View style={styles.content}>
            <PostContent content={post.content} />
          </View>
        ) : null}

        {post.poll ? (
          <View style={styles.pollWrap}>
            <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
          </View>
        ) : null}

        {firstMedia ? (
          <Image
            source={{ uri: resolveMediaUrl(firstMedia) ?? firstMedia }}
            style={styles.media}
            contentFit="cover"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
