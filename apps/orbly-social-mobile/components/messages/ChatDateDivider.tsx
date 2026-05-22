import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function ChatDateDivider({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: OrblyColors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: OrblyColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: OrblyColors.bgSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
});
