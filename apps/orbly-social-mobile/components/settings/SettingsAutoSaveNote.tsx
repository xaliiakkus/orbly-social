import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function SettingsAutoSaveNote() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Değişiklikler otomatik kaydedilir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  text: { fontSize: 13, color: OrblyColors.textSecondary },
});
