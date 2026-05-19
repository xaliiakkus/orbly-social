import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyDialog } from "@/components/ui/Dialog";
import { OrblyColors } from "@/constants/Colors";

export function PostOwnerMenuDialog({
  visible,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <OrblyDialog visible={visible} onClose={onClose} title="Gönderi" size="sm">
      <View style={styles.list}>
        <MenuRow
          icon="pencil"
          label="Düzenle"
          onPress={() => {
            onClose();
            onEdit();
          }}
        />
        <MenuRow
          icon="trash"
          label="Sil"
          destructive
          onPress={() => {
            onClose();
            onDelete();
          }}
        />
        <Pressable style={styles.cancelRow} onPress={onClose}>
          <Text style={styles.cancelText}>İptal</Text>
        </Pressable>
      </View>
    </OrblyDialog>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <FontAwesome
        name={icon}
        size={18}
        color={destructive ? OrblyColors.like : OrblyColors.textPrimary}
      />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, fontWeight: "600", color: OrblyColors.textPrimary },
  rowLabelDanger: { color: OrblyColors.like },
  cancelRow: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: OrblyColors.textSecondary },
});
