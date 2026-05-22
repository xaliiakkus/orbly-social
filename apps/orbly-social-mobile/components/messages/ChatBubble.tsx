import {
  formatMessageTime,
  isGroupedWithPrevious,
  isMessageMine,
  resolveMessageSender,
  shouldShowMessageAvatar,
  shouldShowSenderLabel,
} from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import type { MessageItem, UserPublic } from "@orbly/types";

export function ChatBubble({
  message,
  me,
  other,
  allMessages,
  messageIndex,
}: {
  message: MessageItem;
  me: UserPublic | null | undefined;
  other: UserPublic | null | undefined;
  allMessages: MessageItem[];
  messageIndex: number;
}) {
  const mine = isMessageMine(message.senderId, me?.id);
  const sender = resolveMessageSender(message, me, other);
  const showAvatar = shouldShowMessageAvatar(allMessages, messageIndex);
  const showLabel = shouldShowSenderLabel(allMessages, messageIndex);
  const grouped = isGroupedWithPrevious(allMessages, messageIndex);
  const hasText =
    !!message.content?.trim() && message.content.trim() !== "📎";

  const bubble = (
    <View
      style={[
        styles.bubble,
        mine ? styles.bubbleMine : styles.bubbleOther,
        grouped && (mine ? styles.bubbleMineGrouped : styles.bubbleOtherGrouped),
      ]}
    >
      {hasText ? (
        <Text style={mine ? styles.contentMine : styles.contentOther}>
          {message.content}
        </Text>
      ) : null}
      {message.mediaUrls?.map((url) => (
        <Image key={url} source={{ uri: url }} style={styles.media} contentFit="cover" />
      ))}
      <View style={[styles.metaRow, mine && styles.metaRowMine]}>
        <Text style={mine ? styles.timeMine : styles.timeOther}>
          {formatMessageTime(message.createdAt)}
        </Text>
        {mine ? (
          <FontAwesome
            name={message.isRead ? "check-circle" : "check"}
            size={12}
            color="rgba(255,255,255,0.85)"
          />
        ) : null}
      </View>
    </View>
  );

  if (mine) {
    return (
      <View style={[styles.rowMine, grouped && styles.rowGrouped]}>
        <View style={styles.colMine}>
          {bubble}
        </View>
        {showAvatar ? (
          <UserAvatar
            name={me?.displayName ?? "Sen"}
            uri={me?.avatarUrl ?? sender?.avatarUrl}
            size="sm"
          />
        ) : (
          <View style={styles.avatarSpacer} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.rowOther, grouped && styles.rowGrouped]}>
      {showAvatar ? (
        <UserAvatar
          name={sender?.displayName ?? "?"}
          uri={sender?.avatarUrl}
          size="sm"
        />
      ) : (
        <View style={styles.avatarSpacer} />
      )}
      <View style={styles.colOther}>
        {showLabel ? (
          <Text style={styles.senderLabel}>{sender?.displayName ?? "Kullanıcı"}</Text>
        ) : null}
        {bubble}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowMine: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-end",
    maxWidth: "92%",
  },
  rowOther: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  rowGrouped: { paddingVertical: 2 },
  colMine: { alignItems: "flex-end", flex: 1, minWidth: 0 },
  colOther: { alignItems: "flex-start", flex: 1, minWidth: 0 },
  avatarSpacer: { width: 36 },
  senderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: OrblyColors.textSecondary,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  bubbleMine: {
    backgroundColor: OrblyColors.accent,
    borderBottomRightRadius: 6,
    shadowColor: OrblyColors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleMineGrouped: { borderTopRightRadius: 8 },
  bubbleOther: {
    backgroundColor: OrblyColors.bgSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleOtherGrouped: { borderTopLeftRadius: 8 },
  contentMine: { color: "#fff", fontSize: 15, lineHeight: 21 },
  contentOther: { color: OrblyColors.textPrimary, fontSize: 15, lineHeight: 21 },
  media: { width: 240, height: 170, borderRadius: 14, marginTop: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  metaRowMine: { justifyContent: "flex-end" },
  timeMine: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  timeOther: { color: OrblyColors.textSecondary, fontSize: 11 },
});
