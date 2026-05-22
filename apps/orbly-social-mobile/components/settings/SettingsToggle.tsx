import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}) {
  return (
    <Pressable
      style={[styles.row, disabled && styles.disabled]}
      onPress={() => onChange(!checked)}
      disabled={disabled}
    >
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      <View style={[styles.track, checked && styles.trackOn]}>
        <View style={[styles.thumb, checked && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  disabled: { opacity: 0.5 },
  text: { flex: 1 },
  label: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  desc: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: OrblyColors.bgTertiary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  trackOn: { backgroundColor: OrblyColors.accent, borderColor: OrblyColors.accent },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  thumbOn: { alignSelf: "flex-end" },
});
