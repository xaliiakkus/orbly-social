import type { LiveCommentPublic } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { SOCKET_EVENTS, liveRoom, useLiveComments, useSocketRooms } from "@orbly/features";
import { Image } from "@/components/ui/expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { formatRelativeTime } from "@/lib/format";
import { getSocket } from "@/lib/socket";

export function LiveChatPanel({
  channelId,
  isHost = false,
  canManageRoom = false,
  isSpace = false,
  onInviteSpeaker,
}: {
  channelId: string;
  isHost?: boolean;
  canManageRoom?: boolean;
  isSpace?: boolean;
  onInviteSpeaker?: (userId: string) => void | Promise<void>;
}) {
  const canInvite = canManageRoom || isHost;
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<LiveCommentPublic[]>([]);
  const listRef = useRef<FlatList>(null);
  const { data, isLoading } = useLiveComments(channelId);

  const getSocketStable = useCallback(() => getSocket(), []);
  useSocketRooms(getSocketStable, channelId ? [liveRoom(channelId)] : []);

  useEffect(() => {
    if (data?.data) setComments(data.data);
  }, [data]);

  useEffect(() => {
    const socket = getSocketStable();
    if (!socket || !channelId) return;

    const onChat = (payload: unknown) => {
      const msg = payload as LiveCommentPublic;
      if (!msg?.id) return;
      if (msg.channelId && msg.channelId !== channelId) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on(SOCKET_EVENTS.channelChat, onChat);
    return () => {
      socket.off(SOCKET_EVENTS.channelChat, onChat);
    };
  }, [channelId, getSocketStable]);

  useEffect(() => {
    if (comments.length) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [comments.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setError("");
    setSending(true);
    try {
      const msg = await api.live.sendChat(channelId, content);
      setText("");
      setComments((prev) => (prev.some((c) => c.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Sohbet</Text>
        <Text style={styles.sub}>Yayın sırasında mesajlaş</Text>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={comments}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
          ) : (
            <Text style={styles.empty}>
              İlk yorumu sen yaz. Yayıncı ve izleyiciler burada konuşur.
            </Text>
          )
        }
        renderItem={({ item: c }) => {
          const mine = c.author?.id === me?.id;
          return (
            <View style={styles.comment}>
              {c.author?.avatarUrl ? (
                <Image source={{ uri: c.author.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {(c.author?.displayName ?? "?").charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.commentBody}>
                <View style={styles.commentMeta}>
                  {canInvite && isSpace && c.author?.id && !mine ? (
                    <Pressable onPress={() => void onInviteSpeaker?.(c.author!.id)}>
                      <Text style={styles.authorLink}>{c.author?.displayName}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.author}>{c.author?.displayName}</Text>
                  )}
                  <Text style={styles.time}>{formatRelativeTime(c.createdAt)}</Text>
                </View>
                <Text style={styles.content}>{c.content}</Text>
              </View>
            </View>
          );
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz…"
          placeholderTextColor={OrblyColors.textSecondary}
          onSubmitEditing={() => void send()}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          disabled={!text.trim() || sending}
          onPress={() => void send()}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>Gönder</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 280,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  title: { fontWeight: "800", fontSize: 17, color: OrblyColors.textPrimary },
  sub: { color: OrblyColors.textSecondary, fontSize: 13, marginTop: 2 },
  list: { flex: 1 },
  empty: { color: OrblyColors.textSecondary, textAlign: "center", padding: 24, fontSize: 14 },
  comment: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarLetter: { fontWeight: "700", color: OrblyColors.textPrimary, fontSize: 13 },
  commentBody: { flex: 1, minWidth: 0 },
  commentMeta: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  author: { fontWeight: "700", color: OrblyColors.textPrimary, fontSize: 14 },
  authorLink: { fontWeight: "700", color: OrblyColors.accent, fontSize: 14 },
  time: { color: OrblyColors.textSecondary, fontSize: 12 },
  content: { color: OrblyColors.textPrimary, fontSize: 15, marginTop: 2, lineHeight: 20 },
  error: { color: OrblyColors.like, fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
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
    justifyContent: "center",
    minWidth: 72,
    alignItems: "center",
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#fff", fontWeight: "700" },
});
