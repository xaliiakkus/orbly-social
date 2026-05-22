import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ForgotPasswordModal } from "@/components/settings/ForgotPasswordModal";
import { SettingsAutoSaveNote } from "@/components/settings/SettingsAutoSaveNote";
import { OrblyColors } from "@/constants/Colors";

export function SettingsSecurityPanel() {
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <ScrollView style={styles.flex}>
      <SettingsAutoSaveNote />
      <Pressable style={styles.row} onPress={() => setForgotOpen(true)}>
        <View style={styles.text}>
          <Text style={styles.title}>Şifreni değiştir</Text>
          <Text style={styles.sub}>E-posta ile sıfırlama bağlantısı gönder</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
      </Pressable>
      <View style={styles.soonBlock}>
        <Text style={styles.title}>İki faktörlü kimlik doğrulama</Text>
        <Text style={styles.soon}>Yakında</Text>
      </View>
      <View style={styles.soonBlock}>
        <Text style={styles.title}>Uygulama ve oturumlar</Text>
        <Text style={styles.soon}>Yakında</Text>
      </View>
      <ForgotPasswordModal visible={forgotOpen} onClose={() => setForgotOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  text: { flex: 1 },
  title: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  sub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
  soonBlock: {
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    opacity: 0.55,
  },
  soon: { fontSize: 13, color: OrblyColors.textSecondary, marginTop: 4 },
});
