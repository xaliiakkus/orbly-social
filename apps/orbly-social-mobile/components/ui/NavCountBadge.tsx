import { formatNavBadgeCount } from "@orbly/features";
import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function NavCountBadge({ count }: { count: number }) {
  const label = formatNavBadgeCount(count);
  if (!label) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: OrblyColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
