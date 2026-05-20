import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";

export function ExploreHeader({
  query,
  onChangeQuery,
  onSubmitSearch,
  onOpenMenu,
  onOpenSettings,
  searchMode,
  onBack,
}: {
  query: string;
  onChangeQuery: (q: string) => void;
  onSubmitSearch: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  searchMode?: boolean;
  onBack?: () => void;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <View style={styles.row}>
      {searchMode ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.sideBtn}>
          <FontAwesome name="arrow-left" size={20} color={OrblyColors.textPrimary} />
        </Pressable>
      ) : user ? (
        <Pressable onPress={onOpenMenu} hitSlop={8} style={styles.sideBtn}>
          <UserAvatar name={user.displayName} uri={user.avatarUrl} size="sm" />
        </Pressable>
      ) : (
        <View style={styles.sideBtn} />
      )}

      <View style={styles.searchWrap}>
        <FontAwesome
          name="search"
          size={16}
          color={OrblyColors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Ara"
          placeholderTextColor={OrblyColors.textSecondary}
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={onSubmitSearch}
          returnKeyType="search"
          autoFocus={searchMode}
        />
      </View>

      <Pressable onPress={onOpenSettings} hitSlop={12} style={styles.sideBtn}>
        <FontAwesome name="cog" size={22} color={OrblyColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  sideBtn: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    minHeight: 42,
  },
  searchIcon: { marginLeft: 14 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingRight: 14,
    color: OrblyColors.textPrimary,
    fontSize: 16,
  },
});
