import { convoRoom, useConversations, useCreateConversation } from "@orbly/features";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { ConversationRow } from "@/components/messages/ConversationRow";
import { MessagesInboxHeader } from "@/components/messages/MessagesInboxHeader";
import { EmptyState } from "@/components/EmptyState";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";

export default function MessagesScreen() {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.user?.id);
  const [newUserId, setNewUserId] = useState("");
  const [filter, setFilter] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
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
      const preview = c.lastMessage?.content?.toLowerCase() ?? "";
      return name.includes(q) || user.includes(q) || preview.includes(q);
    });
  }, [data?.data, filter]);

  const unreadTotal = useMemo(
    () => (data?.data ?? []).reduce((n, c) => n + c.unreadCount, 0),
    [data?.data],
  );

  const startChat = () => {
    if (!newUserId.trim()) return;
    create.mutate(newUserId.trim(), {
      onSuccess: (res) => {
        setNewUserId("");
        setShowNewChat(false);
        router.push(`/messages/${res.conversationId}`);
      },
    });
  };

  return (
    <TabScaffold fab={false}>
      <View style={styles.wrap}>
        <MessagesInboxHeader
          unreadTotal={unreadTotal}
          filter={filter}
          onFilterChange={setFilter}
          showNewChat={showNewChat}
          onToggleNewChat={() => setShowNewChat((v) => !v)}
          newUserId={newUserId}
          onNewUserIdChange={setNewUserId}
          onStartChat={startChat}
          startPending={create.isPending}
        />

        <FlatList
          style={styles.list}
          data={conversations}
          keyExtractor={(c) => c.id}
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                title={filter ? "Eşleşen sohbet yok" : "Henüz mesajın yok"}
                description={
                  filter
                    ? "Başka bir arama dene."
                    : "Yeni sohbet ile arkadaşlarına ulaş."
                }
                icon="envelope-o"
              />
            )
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              viewerId={viewerId}
              onPress={() => router.push(`/messages/${item.id}`)}
            />
          )}
        />
      </View>
    </TabScaffold>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  list: { flex: 1 },
});
