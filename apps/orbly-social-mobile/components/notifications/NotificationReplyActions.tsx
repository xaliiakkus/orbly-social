import { notificationReplyTarget, usePostLike } from "@orbly/features";
import type { NotificationItem } from "@orbly/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useReplyComposeOptional } from "@/lib/reply-compose-context";
import { OrblyColors } from "@/constants/Colors";
import { formatCount } from "@/lib/format";

export function NotificationReplyActions({ item }: { item: NotificationItem }) {
  const preview = item.postPreview;
  const replyCompose = useReplyComposeOptional();
  const target = notificationReplyTarget(item);
  const postId = preview?.id ?? "";
  const stats = preview?.stats;

  const { liked, count: likeCount, toggle: toggleLike } = usePostLike(
    postId,
    preview?.likedByMe ?? false,
    stats?.likeCount ?? 0,
  );

  if (!preview || !target) return null;

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.btn}
        onPress={() => replyCompose?.openReply(target)}
        hitSlop={8}
      >
        <FontAwesome name="comment-o" size={17} color={OrblyColors.reply} />
        {(stats?.replyCount ?? 0) > 0 && (
          <Text style={styles.count}>{formatCount(stats!.replyCount)}</Text>
        )}
      </Pressable>
      <Pressable style={styles.btn} hitSlop={8}>
        <FontAwesome name="retweet" size={17} color={OrblyColors.repost} />
        {(stats?.repostCount ?? 0) > 0 && (
          <Text style={styles.count}>{formatCount(stats!.repostCount)}</Text>
        )}
      </Pressable>
      <Pressable style={styles.btn} onPress={() => void toggleLike()} hitSlop={8}>
        <FontAwesome
          name={liked ? "heart" : "heart-o"}
          size={17}
          color={OrblyColors.like}
        />
        {likeCount > 0 && <Text style={styles.count}>{formatCount(likeCount)}</Text>}
      </Pressable>
      <Pressable style={styles.btn} hitSlop={8}>
        <FontAwesome name="share" size={17} color={OrblyColors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 400,
    marginTop: 8,
    marginLeft: -4,
  },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  count: { color: OrblyColors.textSecondary, fontSize: 13 },
});
