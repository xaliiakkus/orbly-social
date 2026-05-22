import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SettingsAutoSaveNote } from "@/components/settings/SettingsAutoSaveNote";
import { OrblyColors } from "@/constants/Colors";

export function SettingsLanguagePanel() {
  return (
    <ScrollView style={styles.flex}>
      <SettingsAutoSaveNote />
      <View style={styles.rowActive}>
        <View>
          <Text style={styles.title}>Türkçe</Text>
          <Text style={styles.sub}>Varsayılan dil</Text>
        </View>
        <FontAwesome name="check" size={18} color={OrblyColors.accent} />
      </View>
      <View style={styles.rowMuted}>
        <View>
          <Text style={styles.title}>English</Text>
          <Text style={styles.sub}>Yakında</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: OrblyColors.bgSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowMuted: {
    padding: 18,
    opacity: 0.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  title: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  sub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
});
