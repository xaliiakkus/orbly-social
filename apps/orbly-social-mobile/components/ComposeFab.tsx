import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ComposeModal } from "@/components/ComposeModal";
import { OrblyColors } from "@/constants/Colors";
import { TAB_BAR_HEIGHT } from "@/constants/layout";

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ComposeFab({ open: controlledOpen, onOpenChange }: Props = {}) {
  const insets = useSafeAreaInsets();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };

  return (
    <>
      <Pressable
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 }]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Gönderi oluştur"
      >
        <FontAwesome name="plus" size={26} color="#fff" />
      </Pressable>

      <ComposeModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: OrblyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: OrblyColors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 40,
  },
});
