import { formatUserError } from "@orbly/api-client";
import { useFollowToggle, useStartConversation } from "@orbly/features";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EditProfileModal } from "@/components/EditProfileModal";
import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { XTabs } from "@/components/ui/XTabs";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

type Tab = "posts" | "broadcasts";

const PROFILE_TABS = [
  { id: "posts" as const, label: "Gönderiler" },
  { id: "broadcasts" as const, label: "Yayınlar" },
];

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const u = String(username ?? "");
  const router = useRouter();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("posts");
  const [editOpen, setEditOpen] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", u],
    queryFn: () => api.users.get(u),
    enabled: !!u,
  });

  const posts = useInfiniteQuery({
    queryKey: ["profile-posts", u],
    queryFn: ({ pageParam }) => api.users.posts(u, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!u && tab === "posts",
  });

  const broadcasts = useQuery({
    queryKey: ["profile-broadcasts", u],
    queryFn: () => api.users.broadcasts(u),
    enabled: !!u && tab === "broadcasts",
  });

  const startDm = useStartConversation();

  const follow = useFollowToggle(u, {
    onFeedback: (f) => {
      if (f.type === "error") {
        Alert.alert("Takip edilemedi", f.message);
      }
    },
  });

  const user = profile.data?.user;
  const isSelf = me?.username === u;
  const isFollowing = profile.data?.isFollowing ?? false;
  const canMessage = profile.data?.canMessage ?? false;

  const onMessage = () => {
    if (!user || !canMessage) {
      Alert.alert(
        "Mesaj gönderilemiyor",
        "Mesaj göndermek için ikinizin de birbirinizi takip etmesi gerekir.",
      );
      return;
    }
    startDm.mutate(user.id, {
      onSuccess: ({ conversationId }) => router.push(`/messages/${conversationId}`),
      onError: (err) => Alert.alert("Hata", formatUserError(err)),
    });
  };
  const postList = posts.data?.pages.flatMap((p) => p.data) ?? [];

  if (profile.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} />
      </View>
    );
  }

  if (profile.isError || !user) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Profil bulunamadı"
          description={profile.isError ? formatUserError(profile.error) : undefined}
        />
      </View>
    );
  }

  const header = (
    <>
      <ProfileHeader
        user={user}
        isSelf={isSelf}
        isFollowing={isFollowing}
        followPending={follow.isPending}
        onFollowToggle={() => follow.mutate(isFollowing)}
        onEditProfile={() => setEditOpen(true)}
        onBack={() => router.back()}
        onSettings={isSelf ? () => router.push("/settings") : undefined}
        onMessage={isSelf ? undefined : onMessage}
        canMessage={canMessage}
        messagePending={startDm.isPending}
      />
      <XTabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />
    </>
  );

  return (
    <View style={styles.container}>
      {tab === "posts" ? (
        <FlatList
          data={postList}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <PostCard post={item} onRefresh={() => void posts.refetch()} />
          )}
          onEndReached={() => {
            if (posts.hasNextPage && !posts.isFetchingNextPage) void posts.fetchNextPage();
          }}
          ListEmptyComponent={
            posts.isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
            ) : (
              <EmptyState title="Henüz gönderi yok" />
            )
          }
        />
      ) : (
        <FlatList
          data={broadcasts.data?.data ?? []}
          keyExtractor={(b) => b.channelId}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable
              style={styles.broadcastRow}
              onPress={() => router.push(`/live/${item.channelId}/ozet`)}
            >
              <FontAwesome name="microphone" size={20} color={OrblyColors.like} />
              <View style={styles.broadcastMeta}>
                <Text style={styles.broadcastTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.broadcastSub}>
                  {item.mode === "video" ? "Görüntülü" : "Sesli"} · {item.durationLabel}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            broadcasts.isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
            ) : (
              <EmptyState title="Yayın geçmişi yok" icon="microphone" />
            )
          }
        />
      )}

      <EditProfileModal
        user={user}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          qc.setQueryData(["profile", u], (prev) =>
            prev ? { ...prev, user: saved } : prev,
          );
          void qc.invalidateQueries({ queryKey: ["profile", u] });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  broadcastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  broadcastMeta: { flex: 1 },
  broadcastTitle: { fontWeight: "700", color: OrblyColors.textPrimary, fontSize: 16 },
  broadcastSub: { color: OrblyColors.textSecondary, fontSize: 13, marginTop: 2 },
});
