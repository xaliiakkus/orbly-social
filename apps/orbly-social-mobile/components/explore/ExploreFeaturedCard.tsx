import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

/** X Keşfet — öne çıkan / keşif kartı (reklam yerine Orbit CTA). */
export function ExploreFeaturedCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.art}>
        <FontAwesome name="rocket" size={48} color={OrblyColors.orbit} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.kicker}>Orbly · Keşfet</Text>
        <Text style={styles.title}>Orbit topluluklarına katıl</Text>
        <Text style={styles.sub}>Nişlerde trend gönderileri ve canlı sohbet</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  art: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(120, 86, 255, 0.12)",
  },
  footer: { padding: 14, gap: 4 },
  kicker: { color: OrblyColors.textSecondary, fontSize: 13 },
  title: { color: OrblyColors.textPrimary, fontSize: 18, fontWeight: "800" },
  sub: { color: OrblyColors.textSecondary, fontSize: 14, lineHeight: 18 },
});
