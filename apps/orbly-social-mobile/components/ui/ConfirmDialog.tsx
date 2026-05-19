import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyDialog } from "@/components/ui/Dialog";
import { OrblyColors } from "@/constants/Colors";

export function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "İptal",
  destructive,
  loading,
  onConfirm,
  singleAction,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  /** Yalnızca onay butonu (bilgi / hata mesajları) */
  singleAction?: boolean;
}) {
  return (
    <OrblyDialog visible={visible} onClose={onClose} title={title} size="sm">
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {!singleAction ? (
          <Pressable
            style={[styles.btn, styles.btnSecondary]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[
            styles.btn,
            destructive ? styles.btnDanger : styles.btnPrimary,
            singleAction && styles.btnFull,
          ]}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
          )}
        </Pressable>
      </View>
    </OrblyDialog>
  );
}

const styles = StyleSheet.create({
  message: {
    color: OrblyColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnSecondary: {
    backgroundColor: OrblyColors.bgTertiary,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  btnSecondaryText: {
    color: OrblyColors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  btnPrimary: { backgroundColor: OrblyColors.accent },
  btnDanger: { backgroundColor: OrblyColors.like },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnFull: { flex: 1 },
});
