import { usePostReposters } from "@orbly/features";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import type { UserPublic } from "@orbly/types";

export function RepostersModal({
  postId,
  visible,
  onClose,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePostReposters(postId, visible);

  const users = data?.pages.flatMap((p) => p.data) ?? [];

  const renderItem = ({ item }: { item: UserPublic }) => (
    <Pressable
      style={styles.row}
      onPress={() => {
        onClose();
        router.push(`/profile/${item.username}`);
      }}
    >
      <UserAvatar name={item.displayName} uri={item.avatarUrl} size="md" />
      <View style={styles.names}>
        <Text style={styles.displayName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Yeniden paylaşanlar</Text>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => u.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={styles.empty}>Henüz yeniden paylaşım yok.</Text>
              }
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
                ) : null
              }
              style={styles.list}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: OrblyColors.bgPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: OrblyColors.border,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: OrblyColors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: { maxHeight: 400 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  names: { flex: 1, minWidth: 0 },
  displayName: { fontSize: 16, fontWeight: "700", color: OrblyColors.textPrimary },
  username: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  empty: {
    textAlign: "center",
    color: OrblyColors.textSecondary,
    padding: 24,
    fontSize: 15,
  },
  loader: { padding: 20 },
});
