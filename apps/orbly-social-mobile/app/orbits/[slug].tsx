import { formatUserError } from "@orbly/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function OrbitDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const s = String(slug ?? "");
  const qc = useQueryClient();

  const orbit = useQuery({
    queryKey: ["orbit", s],
    queryFn: () => api.orbits.get(s),
    enabled: !!s,
  });

  const posts = useQuery({
    queryKey: ["orbit-posts", s],
    queryFn: () => api.orbits.posts(s),
    enabled: !!s,
  });

  const joined = orbit.data?.isMember ?? false;

  const toggle = useMutation({
    mutationFn: () => (joined ? api.orbits.leave(s) : api.orbits.join(s)),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ["orbit", s] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
      try {
        const me = await api.auth.me();
        useAuthStore.getState().setUser(me.user);
      } catch {
        /* ignore */
      }
    },
  });

  const o = orbit.data?.orbit;

  if (orbit.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={OrblyColors.accent} />
      </View>
    );
  }

  if (!o) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Orbit" />
        <EmptyState title="Orbit bulunamadı" icon="star" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={o.name} subtitle={`@${o.slug}`} />
      <View style={styles.hero}>
        <View style={styles.orbitIcon}>
          <Text style={styles.orbitLetter}>{o.name.charAt(0).toUpperCase()}</Text>
        </View>
        {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
        <Text style={styles.members}>{o.stats.memberCount} üye</Text>
        <Pressable
          style={[styles.joinBtn, joined && styles.joinedBtn]}
          disabled={toggle.isPending}
          onPress={() => toggle.mutate()}
        >
          <Text style={[styles.joinText, joined && styles.joinedText]}>
            {joined ? "Üyelikten ayrıl" : "Katıl"}
          </Text>
        </Pressable>
      </View>
      {posts.isLoading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={OrblyColors.accent} />
      ) : posts.isError ? (
        <EmptyState
          title="Gönderiler yüklenemedi"
          description={formatUserError(posts.error)}
        />
      ) : (
        <FlatList
          data={posts.data?.data ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={<EmptyState title="Henüz gönderi yok" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: OrblyColors.border },
  orbitIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(120,86,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  orbitLetter: { fontSize: 24, fontWeight: "800", color: OrblyColors.orbit },
  desc: { color: OrblyColors.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  members: { color: OrblyColors.textSecondary, fontSize: 14, marginBottom: 12 },
  joinBtn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  joinedBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: OrblyColors.border },
  joinText: { fontWeight: "700", color: "#000" },
  joinedText: { color: OrblyColors.textPrimary },
});
