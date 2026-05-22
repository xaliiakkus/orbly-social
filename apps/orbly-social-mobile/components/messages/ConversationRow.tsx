import { formatConversationPreview } from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatRelativeTime } from "@/lib/format";
import type { ConversationItem } from "@orbly/types";

export function ConversationRow({
  item,
  viewerId,
  onPress,
}: {
  item: ConversationItem;
  viewerId?: string | null;
  onPress: () => void;
}) {
  const unread = item.unreadCount > 0;
  const preview = formatConversationPreview(item.lastMessage, viewerId);

  return (
    <Pressable
      style={[styles.row, unread && styles.rowUnread]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <UserAvatar
          name={item.participant?.displayName ?? "?"}
          uri={item.participant?.avatarUrl}
          size="lg"
        />
        {unread ? <View style={styles.onlineDot} /> : null}
      </View>

      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
            {item.participant?.displayName ?? "Sohbet"}
          </Text>
          {item.participant?.verified ? (
            <FontAwesome name="check-circle" size={14} color={OrblyColors.accent} />
          ) : null}
          {item.lastMessage?.createdAt ? (
            <Text style={[styles.time, unread && styles.timeUnread]}>
              {formatRelativeTime(item.lastMessage.createdAt)}
            </Text>
          ) : null}
        </View>
        {item.participant?.username ? (
          <Text style={styles.username} numberOfLines={1}>
            @{item.participant.username}
          </Text>
        ) : null}
        <Text
          style={[styles.preview, unread && styles.previewUnread]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      {unread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.unreadCount > 99 ? "99+" : item.unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowUnread: {
    backgroundColor: "rgba(29, 155, 240, 0.06)",
  },
  avatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: OrblyColors.accent,
    borderWidth: 2,
    borderColor: OrblyColors.bgPrimary,
  },
  meta: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    flex: 1,
    color: OrblyColors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  nameUnread: { fontWeight: "800" },
  username: {
    color: OrblyColors.textSecondary,
    fontSize: 13,
    marginTop: 1,
  },
  preview: {
    color: OrblyColors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  previewUnread: {
    color: OrblyColors.textPrimary,
    fontWeight: "500",
  },
  time: {
    color: OrblyColors.textSecondary,
    fontSize: 12,
    marginLeft: "auto",
  },
  timeUnread: { color: OrblyColors.accent, fontWeight: "600" },
  badge: {
    backgroundColor: OrblyColors.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
