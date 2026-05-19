import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <FontAwesome name={icon} size={40} color={OrblyColors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 32, alignItems: "center", gap: 12 },
  title: { color: OrblyColors.textPrimary, fontSize: 18, fontWeight: "700", textAlign: "center" },
  desc: { color: OrblyColors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22 },
  action: { color: OrblyColors.accent, fontWeight: "700", fontSize: 15, marginTop: 8 },
});
