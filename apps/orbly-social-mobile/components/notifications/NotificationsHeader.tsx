import { Ionicons } from "@/components/ui/icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { HEADER_CONTENT_MIN_HEIGHT, useHeaderMetrics } from "@/constants/layout";
import { useAuthStore } from "@/lib/auth-store";

export function NotificationsHeader({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const header = useHeaderMetrics();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <View style={[styles.bar, { paddingTop: header.paddingTop }]}>
      {user ? (
        <Pressable onPress={onMenuOpen} style={styles.side} hitSlop={8}>
          <UserAvatar name={user.displayName} uri={user.avatarUrl} size="sm" />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title}>Bildirimler</Text>
      <Pressable
        onPress={() => router.push("/settings?section=notifications" as never)}
        style={styles.side}
        hitSlop={8}
        accessibilityLabel="Ayarlar"
      >
        <Ionicons name="settings-outline" size={22} color={OrblyColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: HEADER_CONTENT_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
  },
  side: { width: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: OrblyColors.textPrimary },
});
