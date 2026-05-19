import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

export default function BookmarksScreen() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.bookmarks.list(),
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Yer imleri" largeTitle />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={OrblyColors.accent} />
      ) : isError ? (
        <EmptyState
          title="Yüklenemedi"
          description={formatUserError(error)}
          icon="bookmark-o"
          actionLabel="Tekrar dene"
          onAction={() => void refetch()}
        />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-o"
              title="Yer imi yok"
              description="Beğendiğin gönderileri yer imlerine ekleyerek burada bulabilirsin."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
});
