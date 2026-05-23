import {
  convoRoom,
  groupMessagesByDay,
  isMessageMine,
  useConversationMessages,
  useConversations,
  useSendMessage,
} from "@orbly/features";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ChatBubble } from "@/components/messages/ChatBubble";
import { ChatComposer } from "@/components/messages/ChatComposer";
import { ChatDateDivider } from "@/components/messages/ChatDateDivider";
import { ScreenHeader } from "@/components/ScreenHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";
import { uploadImage } from "@/lib/upload";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";
import type { MessageItem, UserPublic } from "@orbly/types";

type ListItem =
  | { type: "date"; key: string; label: string }
  | { type: "message"; key: string; message: MessageItem; index: number };

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convoId = id ?? "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ListItem>>(null);
  const { data: convos } = useConversations();
  const { data } = useConversationMessages(convoId);
  const send = useSendMessage(convoId);

  const participant = useMemo(() => {
    const fromList = convos?.data.find((c) => c.id === convoId)?.participant;
    if (fromList) return fromList;
    if (!me || !data?.data.length) return null;
    const otherMsg = data.data.find((m) => !isMessageMine(m.senderId, me.id));
    return otherMsg?.sender ?? null;
  }, [convos?.data, convoId, data?.data, me]);

  const flatMessages = data?.data ?? [];

  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    for (const group of groupMessagesByDay(flatMessages)) {
      items.push({ type: "date", key: `d-${group.dateKey}`, label: group.label });
      group.messages.forEach((message) => {
        const index = flatMessages.findIndex((m) => m.id === message.id);
        items.push({
          type: "message",
          key: message.id,
          message,
          index: index >= 0 ? index : 0,
        });
      });
    }
    return items;
  }, [flatMessages]);

  useMobileSocketRooms(convoId ? [convoRoom(convoId)] : []);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    if (!flatMessages.length) return;
    scrollToBottom(true);
  }, [flatMessages.length]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => scrollToBottom(true),
    );
    return () => showSub.remove();
  }, []);

  const pickAndSend = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !convoId) return;
    const asset = res.assets[0];
    if (!asset) return;
    const url = await uploadImage(
      asset.uri,
      asset.fileName ?? "img.jpg",
      asset.mimeType ?? "image/jpeg",
    );
    if (!me?.id) return;
    send.mutate(
      { content: text.trim() || "📎", mediaUrls: [url], senderId: me.id },
      { onSuccess: () => setText("") },
    );
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
          data={listItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Sohbete başla</Text>
              <Text style={styles.emptyBody}>
                {participant
                  ? `${participant.displayName} ile ilk mesajını gönder.`
                  : "İlk mesajını yaz."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === "date") {
              return <ChatDateDivider label={item.label} />;
            }
            return (
              <ChatBubble
                message={item.message}
                me={me}
                other={participant}
                allMessages={flatMessages}
                messageIndex={item.index}
              />
            );
          }}
        />

        <ChatComposer
          text={text}
          onChangeText={setText}
          bottomInset={insets.bottom}
          pending={send.isPending}
          onAttach={() => void pickAndSend()}
          onSend={() => {
            if (!text.trim() || !me?.id) return;
            send.mutate(
              { content: text.trim(), senderId: me.id },
              { onSuccess: () => setText("") },
            );
            setText("");
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  flex: { flex: 1 },
  listContent: { paddingVertical: 8, flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: OrblyColors.textPrimary,
  },
  emptyBody: {
    fontSize: 15,
    color: OrblyColors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
});
