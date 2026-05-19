import {
  getEntryHref,
  getGroupedHeadline,
  getNotificationHeadline,
  getNotificationIconKind,
  getReplyingToLabel,
  isFollowStyleNotification,
  isReplyStyleNotification,
  notificationShowsMediaThumb,
  type NotificationFeedEntry,
} from "@orbly/features";
import type { NotificationItem } from "@orbly/types";
import { Image } from "@/components/ui/expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NotificationAvatarStack } from "@/components/notifications/NotificationAvatarStack";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { NotificationReplyActions } from "@/components/notifications/NotificationReplyActions";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";

export function NotificationRow({
  entry,
  onOpen,
}: {
  entry: NotificationFeedEntry;
  onOpen?: (entry: NotificationFeedEntry) => void;
}) {
  if (entry.kind === "group") {
    return <GroupRow entry={entry} onOpen={onOpen} />;
  }
  return <SingleRow item={entry.item} onOpen={() => onOpen?.(entry)} />;
}

function SingleRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const href = getEntryHref({ kind: "single", item });
  const iconKind = getNotificationIconKind(item.type);
  const replyStyle = isReplyStyleNotification(item);
  const followStyle = isFollowStyleNotification(item);
  const showThumb = notificationShowsMediaThumb(item);
  const replyTo = item.postPreview ? getReplyingToLabel(item.postPreview) : null;

  const open = () => {
    onOpen?.();
    if (href) router.push(href as never);
  };

  if (replyStyle && item.actor && item.postPreview) {
    return (
      <View style={[styles.replyWrap, !item.isRead && styles.unread]}>
        <Pressable style={styles.replyRow} onPress={open} disabled={!href}>
          {!item.isRead ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
          <UserAvatar name={item.actor.displayName} uri={item.actor.avatarUrl} size="md" />
          <View style={styles.replyBody}>
            <Text style={styles.meta}>
              <Text style={styles.bold}>{item.actor.displayName}</Text>
              {item.actor.verified ? <Text style={styles.verified}> ✓</Text> : null}
              <Text style={styles.muted}> @{item.actor.username}</Text>
              <Text style={styles.muted}> · {formatRelativeTime(item.createdAt)}</Text>
            </Text>
            {replyTo ? (
              <Text style={styles.replyCtx}>
                Yanıtlanıyor <Text style={styles.replyToUser}>@{replyTo}</Text>
              </Text>
            ) : null}
            <Text style={styles.replyContent}>{item.postPreview.content}</Text>
            {item.postPreview.mediaUrl ? (
              <Image
                source={{ uri: resolveMediaUrl(item.postPreview.mediaUrl) }}
                style={styles.replyMedia}
                contentFit="cover"
              />
            ) : null}
          </View>
        </Pressable>
        <View style={styles.actionsWrap}>
          <NotificationReplyActions item={item} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.row, !item.isRead && styles.unread]}
      onPress={open}
      disabled={!href}
    >
      {!item.isRead ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
      <View style={styles.iconCol}>
        <NotificationIcon kind={iconKind} />
      </View>
      <View style={styles.main}>
        <View style={styles.headlineRow}>
          {item.actor ? (
            <UserAvatar
              name={item.actor.displayName}
              uri={item.actor.avatarUrl}
              size={followStyle ? "md" : "sm"}
            />
          ) : null}
          <Text style={styles.headline} numberOfLines={3}>
            <Text style={styles.bold}>{getNotificationHeadline(item)}</Text>
            {item.actor?.verified ? <Text style={styles.verified}> ✓</Text> : null}
            <Text style={styles.muted}> · {formatRelativeTime(item.createdAt)}</Text>
          </Text>
        </View>
        {item.postPreview?.content && item.type !== "reply" ? (
          <Text style={styles.preview} numberOfLines={2}>
            {item.postPreview.content}
          </Text>
        ) : null}
      </View>
      {showThumb && item.postPreview?.mediaUrl ? (
        <Image
          source={{ uri: resolveMediaUrl(item.postPreview.mediaUrl) }}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : null}
    </Pressable>
  );
}

function GroupRow({
  entry,
  onOpen,
}: {
  entry: Extract<NotificationFeedEntry, { kind: "group" }>;
  onOpen?: (entry: NotificationFeedEntry) => void;
}) {
  const router = useRouter();
  const g = entry.group;
  const href = getEntryHref(entry);
  const iconKind = getNotificationIconKind(g.type);
  const showThumb =
    !!g.postPreview?.mediaUrl &&
    (g.type === "like" || g.type === "repost" || g.type === "mention");

  const open = () => {
    onOpen?.(entry);
    if (href) router.push(href as never);
  };

  return (
    <Pressable style={[styles.row, !g.isRead && styles.unread]} onPress={open} disabled={!href}>
      {!g.isRead ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
      <View style={styles.iconCol}>
        <NotificationIcon kind={iconKind} />
      </View>
      <View style={styles.main}>
        <View style={styles.headlineRow}>
          <NotificationAvatarStack actors={g.actors} />
          <Text style={styles.headline} numberOfLines={3}>
            <Text style={styles.bold}>{getGroupedHeadline(g)}</Text>
            <Text style={styles.muted}> · {formatRelativeTime(g.createdAt)}</Text>
          </Text>
        </View>
        {g.postPreview?.content ? (
          <Text style={styles.preview} numberOfLines={2}>
            {g.postPreview.content}
          </Text>
        ) : null}
      </View>
      {showThumb && g.postPreview?.mediaUrl ? (
        <Image
          source={{ uri: resolveMediaUrl(g.postPreview.mediaUrl) }}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    alignItems: "flex-start",
  },
  replyWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  replyRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "flex-start",
  },
  actionsWrap: { paddingLeft: 50, paddingRight: 14, paddingBottom: 12 },
  unread: { backgroundColor: "rgba(29, 155, 240, 0.06)" },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OrblyColors.accent,
    marginTop: 8,
  },
  dotSpacer: { width: 6 },
  iconCol: { width: 26, alignItems: "center", paddingTop: 2 },
  main: { flex: 1, minWidth: 0 },
  headlineRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  headline: { flex: 1, fontSize: 15, lineHeight: 20, color: OrblyColors.textPrimary },
  bold: { fontWeight: "700", color: OrblyColors.textPrimary },
  muted: { color: OrblyColors.textSecondary, fontWeight: "400" },
  verified: { color: OrblyColors.accent, fontWeight: "700" },
  preview: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    color: OrblyColors.textSecondary,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
  replyBody: { flex: 1, minWidth: 0 },
  meta: { fontSize: 15, lineHeight: 20, color: OrblyColors.textPrimary },
  replyCtx: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  replyToUser: { color: OrblyColors.accent, fontWeight: "600" },
  replyContent: { fontSize: 15, lineHeight: 20, color: OrblyColors.textPrimary, marginTop: 4 },
  replyMedia: {
    marginTop: 8,
    width: "100%",
    maxHeight: 160,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
});
