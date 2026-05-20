import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { formatCount } from "@/lib/format";

export function ExploreTrendRow({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.body}>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Pressable
        hitSlop={12}
        style={styles.menuBtn}
        onPress={(e) => e.stopPropagation?.()}
        accessibilityLabel="Seçenekler"
      >
        <FontAwesome name="ellipsis-h" size={18} color={OrblyColors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    gap: 8,
  },
  body: { flex: 1, minWidth: 0 },
  meta: { color: OrblyColors.textSecondary, fontSize: 13, lineHeight: 18 },
  title: {
    color: OrblyColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 2,
  },
  menuBtn: { paddingTop: 2, paddingLeft: 4 },
});

export function trendMetaLine(postCount: number, category = "Gündemdekiler"): string {
  if (postCount >= 10_000) {
    return `Türkiye tarihinde gündemde · ${formatCount(postCount)} gönderi`;
  }
  return `${category} · ${formatCount(postCount)} gönderi`;
}
