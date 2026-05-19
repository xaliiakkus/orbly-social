import type { PostPublic } from "@orbly/types";
import { Image } from "@/components/ui/expo-image";
import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";

export function ReplyTargetPreview({ post }: { post: PostPublic }) {
  const firstMedia = post.mediaUrls[0];

  return (
    <View style={styles.root}>
      <View style={styles.threadCol}>
        <UserAvatar name={post.author.displayName} uri={post.author.avatarUrl} size="md" />
        <View style={styles.threadLine} />
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {post.author.displayName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            @{post.author.username} · {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
        {post.content.trim() ? (
          <Text style={styles.content}>{post.content}</Text>
        ) : null}
        {firstMedia ? (
          <Image
            source={{ uri: resolveMediaUrl(firstMedia) }}
            style={styles.media}
            contentFit="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", gap: 12 },
  threadCol: { alignItems: "center", width: 40 },
  threadLine: {
    flex: 1,
    width: 2,
    minHeight: 12,
    marginTop: 4,
    borderRadius: 1,
    backgroundColor: OrblyColors.border,
  },
  body: { flex: 1, minWidth: 0 },
  metaRow: { gap: 2 },
  displayName: {
    color: OrblyColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: OrblyColors.textSecondary,
    fontSize: 15,
  },
  content: {
    marginTop: 4,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  media: {
    marginTop: 8,
    width: "100%",
    maxHeight: 140,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
});
