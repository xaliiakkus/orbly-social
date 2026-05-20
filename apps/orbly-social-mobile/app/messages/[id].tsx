import {
  convoRoom,
  isMessageMine,
  resolveMessageSender,
  SOCKET_EVENTS,
  useConversationMessages,
  useConversations,
  useSendMessage,
} from "@orbly/features";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ScreenHeader } from "@/components/ScreenHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";
import { formatRelativeTime } from "@/lib/format";
import { getSocket } from "@/lib/socket";
import { uploadImage } from "@/lib/upload";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";
import type { MessageItem, UserPublic } from "@orbly/types";

function ChatBubble({
  message,
  me,
  other,
}: {
  message: MessageItem;
  me: UserPublic | null | undefined;
  other: UserPublic | null | undefined;
}) {
  const mine = isMessageMine(message.senderId, me?.id);
  const sender = resolveMessageSender(message, me, other);
  const label = mine ? "Sen" : sender?.displayName ?? "Kullanıcı";

  if (mine) {
    return (
      <View style={styles.rowMineWrap}>
        <View style={styles.bubbleColMine}>
          <Text style={[styles.senderLabel, styles.senderLabelMine]}>{label}</Text>
          <View style={[styles.bubble, styles.bubbleMine]}>
            {message.content ? (
              <Text style={styles.contentMine}>{message.content}</Text>
            ) : null}
            {message.mediaUrls?.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.media} contentFit="cover" />
            ))}
            <Text style={styles.timeMine}>{formatRelativeTime(message.createdAt)}</Text>
          </View>
        </View>
        <UserAvatar
          name={me?.displayName ?? "Sen"}
          uri={me?.avatarUrl ?? sender?.avatarUrl}
          size="sm"
        />
      </View>
    );
  }

  return (
    <View style={styles.rowOtherWrap}>
      <UserAvatar
        name={sender?.displayName ?? "?"}
        uri={sender?.avatarUrl}
        size="sm"
      />
      <View style={styles.bubbleColOther}>
        <Text style={styles.senderLabel}>{label}</Text>
        <View style={[styles.bubble, styles.bubbleOther]}>
          {message.content ? (
            <Text style={styles.contentOther}>{message.content}</Text>
          ) : null}
          {message.mediaUrls?.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.media} contentFit="cover" />
          ))}
          <Text style={styles.timeOther}>{formatRelativeTime(message.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convoId = id ?? "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<MessageItem>>(null);
  const { data: convos } = useConversations();
  const { data, refetch } = useConversationMessages(convoId);
  const send = useSendMessage(convoId);

  const participant = useMemo(() => {
    const fromList = convos?.data.find((c) => c.id === convoId)?.participant;
    if (fromList) return fromList;
    if (!me || !data?.data.length) return null;
    const otherMsg = data.data.find((m) => !isMessageMine(m.senderId, me.id));
    return otherMsg?.sender ?? null;
  }, [convos?.data, convoId, data?.data, me]);

  useMobileSocketRooms(convoId ? [convoRoom(convoId)] : []);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !convoId) return;
    const s = getSocket(token);
    const handler = (payload: { conversationId?: string }) => {
      if (payload.conversationId === convoId) void refetch();
    };
    s.on(SOCKET_EVENTS.message, handler);
    return () => {
      s.off(SOCKET_EVENTS.message, handler);
    };
  }, [convoId, refetch]);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    if (!data?.data.length) return;
    scrollToBottom(true);
  }, [data?.data.length]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => scrollToBottom(true),
    );
    return () => showSub.remove();
  }, []);

  const pickAndSend = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });
    if (res.canceled || !convoId) return;
    const asset = res.assets[0];
    if (!asset) return;
    const url = await uploadImage(
      asset.uri,
      asset.fileName ?? "img.jpg",
      asset.mimeType ?? "image/jpeg",
    );
    send.mutate({ content: text.trim() || "📎", mediaUrls: [url] });
    setText("");
  };

  const headerRight = participant ? (
    <Pressable
      onPress={() => router.push(`/profile/${participant.username}`)}
      hitSlop={8}
    >
      <UserAvatar name={participant.displayName} uri={participant.avatarUrl} size="sm" />
    </Pressable>
  ) : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={participant?.displayName ?? "Sohbet"}
        subtitle={participant ? `@${participant.username}` : undefined}
        right={headerRight}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={data?.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyChat}>İlk mesajı sen gönder</Text>
          }
          renderItem={({ item }) => (
            <ChatBubble message={item} me={me} other={participant} />
          )}
        />

        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable onPress={() => void pickAndSend()}>
            <FontAwesome name="paperclip" size={22} color={OrblyColors.accent} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Mesaj yaz"
            placeholderTextColor={OrblyColors.textSecondary}
            multiline
            maxLength={2000}
            onFocus={() => scrollToBottom(true)}
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}
            disabled={!text.trim() || send.isPending}
            onPress={() => {
              if (!text.trim()) return;
              send.mutate({ content: text.trim() });
              setText("");
            }}
          >
            <Text style={styles.sendText}>Gönder</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  flex: { flex: 1 },
  listContent: { paddingVertical: 8, flexGrow: 1 },
  emptyChat: {
    color: OrblyColors.textSecondary,
    textAlign: "center",
    marginTop: 48,
    fontSize: 15,
  },
  rowOtherWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  rowMineWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-end",
    maxWidth: "92%",
  },
  bubbleColOther: { flex: 1, alignItems: "flex-start", minWidth: 0 },
  bubbleColMine: { flex: 1, alignItems: "flex-end", minWidth: 0 },
  senderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: OrblyColors.textSecondary,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  senderLabelMine: { textAlign: "right" },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%" },
  bubbleMine: {
    backgroundColor: OrblyColors.accent,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: OrblyColors.bgSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    borderBottomLeftRadius: 6,
  },
  contentMine: { color: "#fff", fontSize: 15, lineHeight: 20 },
  contentOther: { color: OrblyColors.textPrimary, fontSize: 15, lineHeight: 20 },
  media: { width: 220, height: 160, borderRadius: 12, marginTop: 8 },
  timeMine: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 6, textAlign: "right" },
  timeOther: { color: OrblyColors.textSecondary, fontSize: 11, marginTop: 6 },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: OrblyColors.textPrimary,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: OrblyColors.accent,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#fff", fontWeight: "700" },
});
