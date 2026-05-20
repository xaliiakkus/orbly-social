import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export type ExploreScrollTab<T extends string> = { id: T; label: string };

export function ExploreScrollTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly ExploreScrollTab<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.label, selected && styles.labelActive]}>{t.label}</Text>
              {selected ? <View style={styles.indicator} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center",
    minWidth: 72,
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
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: OrblyColors.accent,
  },
});
