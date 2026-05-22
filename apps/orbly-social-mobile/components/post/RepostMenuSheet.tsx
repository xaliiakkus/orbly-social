import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrblyColors } from "@/constants/Colors";

type IonName = ComponentProps<typeof Ionicons>["name"];

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={OrblyColors.textPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

export function RepostMenuSheet({
  visible,
  onClose,
  reposted,
  onRepost,
  onUnrepost,
  onQuote,
  onViewEngagements,
}: {
  visible: boolean;
  onClose: () => void;
  reposted: boolean;
  onRepost: () => void;
  onUnrepost: () => void;
  onQuote: () => void;
  onViewEngagements: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={styles.handle} />
          {reposted ? (
            <MenuRow
              icon="arrow-undo-outline"
              label="Yeniden paylaşımı geri al"
              onPress={() => {
                onClose();
                onUnrepost();
              }}
            />
          ) : (
            <MenuRow
              icon="repeat-outline"
              label="Yeniden paylaş"
              onPress={() => {
                onClose();
                onRepost();
              }}
            />
          )}
          <MenuRow
            icon="create-outline"
            label="Alıntı"
            onPress={() => {
              onClose();
              onQuote();
            }}
          />
          <MenuRow
            icon="stats-chart-outline"
            label="Gönderi etkileşimlerini görüntüle"
            onPress={() => {
              onClose();
              onViewEngagements();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: OrblyColors.bgPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: OrblyColors.border,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: OrblyColors.bgSecondary,
  },
  rowLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: OrblyColors.textPrimary,
  },
});
