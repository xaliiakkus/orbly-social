import { convoRoom, useConversations, useCreateConversation } from "@orbly/features";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { TabPageHeader } from "@/components/ui/TabPageHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatRelativeTime } from "@/lib/format";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";

export default function MessagesScreen() {
  const router = useRouter();
  const [newUserId, setNewUserId] = useState("");
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useConversations();
  const create = useCreateConversation();

  const rooms = useMemo(
    () => (data?.data ?? []).map((c) => convoRoom(c.id)),
    [data?.data],
  );
  useMobileSocketRooms(rooms);

  const conversations = useMemo(() => {
    const list = data?.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const name = c.participant?.displayName?.toLowerCase() ?? "";
      const user = c.participant?.username?.toLowerCase() ?? "";
      return name.includes(q) || user.includes(q);
    });
  }, [data?.data, filter]);

  const startChat = () => {
    if (!newUserId.trim()) return;
    create.mutate(newUserId.trim(), {
      onSuccess: (res) => {
        setNewUserId("");
        router.push(`/messages/${res.conversationId}`);
      },
    });
  };

  return (
    <TabScaffold>
      <View style={styles.wrap}>
        <TabPageHeader title="Mesajlar" />
        <FlatList
          style={styles.list}
          data={conversations}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
            <>
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.search}
                  value={filter}
                  onChangeText={setFilter}
                  placeholder="Sohbetlerde ara"
                  placeholderTextColor={OrblyColors.textSecondary}
                />
              </View>
              <View style={styles.newChat}>
                <TextInput
                  style={styles.newChatInput}
                  value={newUserId}
                  onChangeText={setNewUserId}
                  placeholder="Kullanıcı adı ile yeni sohbet"
                  placeholderTextColor={OrblyColors.textSecondary}
                />
                <Pressable
                  style={styles.newChatBtn}
                  onPress={startChat}
                  disabled={create.isPending}
                >
                  <Text style={styles.newChatBtnText}>Başlat</Text>
                </Pressable>
              </View>
            </>
          }
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                title="Henüz mesajın yok"
                description="Yeni sohbet başlatabilirsin."
                icon="envelope-o"
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/messages/${item.id}`)}
            >
              <UserAvatar
                name={item.participant?.displayName ?? "?"}
                uri={item.participant?.avatarUrl}
                size="lg"
              />
              <View style={styles.meta}>
                <Text style={styles.name}>
                  {item.participant?.displayName ?? "Sohbet"}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage?.content ?? "Sohbet başlat"}
                </Text>
                {item.lastMessage?.createdAt ? (
                  <Text style={styles.time}>
                    {formatRelativeTime(item.lastMessage.createdAt)}
                  </Text>
                ) : null}
              </View>
              {item.unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      </View>
    </TabScaffold>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  list: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  search: {
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: OrblyColors.textPrimary,
    fontSize: 15,
  },
  newChat: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  newChatInput: {
    flex: 1,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: OrblyColors.textPrimary,
    fontSize: 15,
  },
  newChatBtn: {
    backgroundColor: OrblyColors.accent,
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  newChatBtnText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  meta: { flex: 1, minWidth: 0 },
  name: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 17 },
  preview: { color: OrblyColors.textSecondary, fontSize: 15, marginTop: 4 },
  time: { color: OrblyColors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: OrblyColors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
