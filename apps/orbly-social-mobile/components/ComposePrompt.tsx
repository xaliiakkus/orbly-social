import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";

/** X feed üstü: "Ne oluyor?" satırı */
export function ComposePrompt({ onPress }: { onPress: () => void }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <UserAvatar name={user.displayName} uri={user.avatarUrl} size="md" />
      <Text style={styles.placeholder}>Neler oluyor?</Text>
      <View style={styles.icons}>
        <FontAwesome name="image" size={20} color={OrblyColors.accent} />
        <FontAwesome name="film" size={20} color={OrblyColors.accent} />
        <FontAwesome name="bar-chart" size={20} color={OrblyColors.accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  placeholder: {
    flex: 1,
    fontSize: 17,
    color: OrblyColors.textSecondary,
  },
  icons: { flexDirection: "row", gap: 14, paddingLeft: 4 },
});
