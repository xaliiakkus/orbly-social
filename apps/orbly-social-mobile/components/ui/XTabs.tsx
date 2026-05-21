import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export type XTabItem<T extends string> = { id: T; label: string };

export function XTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly XTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <Pressable key={t.id} style={styles.tab} onPress={() => onChange(t.id)}>
            <Text style={[styles.label, selected && styles.labelActive]}>{t.label}</Text>
            {selected ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: OrblyColors.textSecondary,
  },
  labelActive: {
    color: OrblyColors.textPrimary,
    fontWeight: "700",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: OrblyColors.accent,
  },
});
