import { formatUserError } from "@orbly/api-client";
import { useFollowToggle, useStartConversation } from "@orbly/features";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { EditProfileModal } from "@/components/EditProfileModal";
import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOrbitsList } from "@/components/profile/ProfileOrbitsList";
import { XTabs } from "@/components/ui/XTabs";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl } from "@/lib/media-url";
import type { PostPublic } from "@orbly/types";
import { Image } from "@/components/ui/expo-image";

type Tab = "posts" | "broadcasts" | "replies" | "media" | "orbits";

const PROFILE_TABS = [
  { id: "posts" as const, label: "Gönderiler" },
  { id: "broadcasts" as const, label: "Yayınlar" },
  { id: "replies" as const, label: "Yanıtlar" },
  { id: "media" as const, label: "Medya" },
  { id: "orbits" as const, label: "Orbit'ler" },
];

function TabPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderDesc}>{description}</Text>
    </View>
  );
}

function MediaGrid({ posts }: { posts: PostPublic[] }) {
  const router = useRouter();
  const mediaPosts = posts.filter((p) => p.mediaUrls.length > 0);
  if (!mediaPosts.length) {
    return <TabPlaceholder title="Medya yok" description="Bu kullanıcı henüz medya paylaşmadı." />;
  }
  return (
    <View style={styles.mediaGrid}>
      {mediaPosts.map((post) => {
        const src = resolveMediaUrl(post.mediaUrls[0]);
        if (!src) return null;
        return (
          <Pressable
            key={post.id}
            style={styles.mediaCell}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Image source={{ uri: src }} style={styles.mediaImage} contentFit="cover" />
          </Pressable>
        );
      })}
    </View>
  );
}

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
    enabled: !!u && (tab === "posts" || tab === "media"),
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
  const isFollowedBy = profile.data?.isFollowedBy ?? false;
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

  const postList = useMemo(
    () => posts.data?.pages.flatMap((p) => p.data) ?? [],
    [posts.data?.pages],
  );

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
        isFollowedBy={isFollowedBy}
        followPending={follow.isPending}
        onFollowToggle={() => follow.mutate(isFollowing)}
        onEditProfile={() => setEditOpen(true)}
        onBack={() => router.back()}
        onSettings={isSelf ? () => router.push("/settings") : undefined}
        onMessage={isSelf ? undefined : onMessage}
        canMessage={canMessage}
        messagePending={startDm.isPending}
        postsCount={user.stats.postsCount}
      />
      <XTabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />
    </>
  );

  const listFooter = posts.isFetchingNextPage ? (
    <ActivityIndicator style={{ marginVertical: 16 }} color={OrblyColors.accent} />
  ) : null;

  if (tab === "orbits") {
    return (
      <View style={styles.container}>
        <FlatList
          data={[{ key: "orbits" }]}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={header}
          renderItem={() => <ProfileOrbitsList username={u} isSelf={isSelf} />}
        />
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

  if (tab === "replies") {
    return (
      <View style={styles.container}>
        {header}
        <TabPlaceholder
          title="Yanıtlar yakında"
          description="Kullanıcının yanıtları burada listelenecek."
        />
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

  if (tab === "media") {
    return (
      <View style={styles.container}>
        <FlatList
          data={[{ key: "media" }]}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={header}
          renderItem={() =>
            posts.isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
            ) : (
              <MediaGrid posts={postList} />
            )
          }
          onEndReached={() => {
            if (posts.hasNextPage && !posts.isFetchingNextPage) void posts.fetchNextPage();
          }}
          ListFooterComponent={listFooter}
        />
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

  if (tab === "broadcasts") {
    const broadcastList = broadcasts.data?.data ?? [];
    return (
      <View style={styles.container}>
        <FlatList
          data={broadcastList}
          keyExtractor={(b) => b.channelId}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable
              style={styles.broadcastRow}
              onPress={() => router.push(`/live/${item.channelId}/ozet`)}
            >
              <View style={styles.broadcastIcon}>
                <FontAwesome name="microphone" size={22} color={OrblyColors.like} />
              </View>
              <View style={styles.broadcastMeta}>
                <View style={styles.broadcastTitleRow}>
                  <Text style={styles.broadcastTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.broadcastAction}>
                    {item.hasReplayVideo ? "İzle" : "Özet"}
                  </Text>
                </View>
                <Text style={styles.broadcastSub}>
                  {item.mode === "video" ? "Görüntülü" : "Sesli"} · {item.durationLabel}
                </Text>
                <Text style={styles.broadcastStats}>
                  {item.peakListeners} tepe · {item.totalComments} yorum
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            broadcasts.isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
            ) : (
              <TabPlaceholder
                title="Henüz yayın yok"
                description="Tamamlanan canlı yayınlar burada listelenir."
              />
            )
          }
        />
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

  return (
    <View style={styles.container}>
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
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          posts.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={OrblyColors.accent} />
          ) : (
            <TabPlaceholder title="Henüz gönderi yok" description="" />
          )
        }
      />

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
  placeholder: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: OrblyColors.textPrimary,
  },
  placeholderDesc: {
    fontSize: 15,
    color: OrblyColors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 2,
  },
  mediaCell: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 1,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    backgroundColor: OrblyColors.bgSecondary,
  },
  broadcastRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  broadcastIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(120, 86, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  broadcastMeta: { flex: 1, minWidth: 0 },
  broadcastTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  broadcastTitle: {
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  broadcastAction: {
    fontSize: 13,
    fontWeight: "700",
    color: OrblyColors.accent,
  },
  broadcastSub: { color: OrblyColors.textSecondary, fontSize: 14, marginTop: 4 },
  broadcastStats: { color: OrblyColors.textSecondary, fontSize: 13, marginTop: 6 },
});
