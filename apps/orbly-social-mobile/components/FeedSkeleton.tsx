import { StyleSheet, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function FeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.body}>
            <View style={styles.lineShort} />
            <View style={styles.lineFull} />
            <View style={styles.lineMid} />
            <View style={styles.media} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OrblyColors.bgSecondary,
  },
  body: { flex: 1, gap: 8, paddingTop: 4 },
  lineShort: {
    height: 14,
    width: "45%",
    borderRadius: 6,
    backgroundColor: OrblyColors.bgSecondary,
  },
  lineFull: {
    height: 14,
    width: "90%",
    borderRadius: 6,
    backgroundColor: OrblyColors.bgSecondary,
  },
  lineMid: {
    height: 14,
    width: "70%",
    borderRadius: 6,
    backgroundColor: OrblyColors.bgSecondary,
  },
  media: {
    height: 160,
    width: "100%",
    borderRadius: 12,
    backgroundColor: OrblyColors.bgSecondary,
    marginTop: 4,
  },
});
