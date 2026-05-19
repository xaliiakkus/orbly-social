import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { MAX_DEVICE_ACCOUNTS } from "@/lib/device-accounts-store";

export function AccountLimitModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <FontAwesome name="exclamation-triangle" size={28} color={OrblyColors.like} />
          <Text style={styles.title}>Hesap limiti</Text>
          <Text style={styles.body}>
            Aynı cihazda en fazla {MAX_DEVICE_ACCOUNTS} hesap kullanılabilir. Dördüncü bir hesap
            eklemek platform kurallarına aykırıdır ve hesabın kalıcı olarak kapatılmasına yol
            açabilir.
          </Text>
          <Text style={styles.body}>
            Yeni hesap eklemek için önce kayıtlı hesaplardan birinin oturumunu kapat.
          </Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Anladım</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: OrblyColors.bgPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    padding: 24,
    gap: 12,
  },
  title: { color: OrblyColors.textPrimary, fontSize: 20, fontWeight: "800" },
  body: { color: OrblyColors.textSecondary, fontSize: 15, lineHeight: 22 },
  btn: {
    marginTop: 8,
    backgroundColor: OrblyColors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
