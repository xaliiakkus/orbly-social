import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { HEADER_CONTENT_MIN_HEIGHT, useHeaderMetrics } from "@/constants/layout";

/** X tarzı sekme sayfası başlığı (Bildirimler, Mesajlar, …) */
export function TabPageHeader({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  const header = useHeaderMetrics();
  return (
    <View style={[styles.bar, { paddingTop: header.paddingTop }]}>
      <Text style={styles.title}>{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: HEADER_CONTENT_MIN_HEIGHT,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: OrblyColors.textPrimary,
  },
  right: { position: "absolute", right: 16, bottom: 8 },
});
