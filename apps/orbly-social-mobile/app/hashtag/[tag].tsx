import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

export default function HashtagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const normalized = decodeURIComponent(String(tag ?? ""))
    .trim()
    .replace(/^#/, "")
    .toLowerCase();

  const hashtag = useQuery({
    queryKey: ["hashtag", normalized],
    queryFn: () => api.feed.hashtag(normalized),
    enabled: normalized.length > 0,
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title={`#${normalized}`} subtitle="Etiket gönderileri" />
      {hashtag.isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={OrblyColors.accent} />
      ) : hashtag.isError ? (
        <EmptyState
          title="Yüklenemedi"
          description={formatUserError(hashtag.error)}
          actionLabel="Tekrar dene"
          onAction={() => void hashtag.refetch()}
        />
      ) : (
        <FlatList
          data={hashtag.data?.data ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            <EmptyState title="Bu etikette gönderi yok" icon="hashtag" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
});
