import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrblyColors } from "@/constants/Colors";

type DialogSize = "sm" | "md" | "lg";

const TABLET_MIN_WIDTH = 600;
const HEADER_HEIGHT = 49;

type DialogLayout = {
  width: number;
  maxHeight: number;
  bodyMaxHeight: number;
  marginH: number;
};

const DialogLayoutContext = createContext<DialogLayout | null>(null);

/** İçerik (ör. FlatList) için kalan yükseklik */
export function useDialogLayout() {
  const ctx = useContext(DialogLayoutContext);
  if (!ctx) {
    throw new Error("useDialogLayout must be used inside OrblyDialog");
  }
  return ctx;
}

function computeLayout(
  size: DialogSize,
  windowWidth: number,
  windowHeight: number,
  insets: { top: number; bottom: number },
): DialogLayout {
  const isTablet = windowWidth >= TABLET_MIN_WIDTH;
  const marginH = windowWidth < 375 ? 16 : windowWidth < 428 ? 20 : 24;
  const marginV = 12;
  const availableW = windowWidth - marginH * 2;
  const availableH =
    windowHeight - insets.top - insets.bottom - marginV * 2;

  let width: number;
  let maxHeight: number;

  switch (size) {
    case "sm":
      width = isTablet ? Math.min(360, availableW) : availableW;
      maxHeight = Math.min(availableH, 440);
      break;
    case "md":
      width = isTablet ? Math.min(420, availableW) : availableW;
      maxHeight = Math.min(availableH * 0.88, 560);
      break;
    case "lg":
      width = isTablet ? Math.min(520, availableW) : availableW;
      maxHeight = Math.min(availableH, Math.round(availableH * 0.94));
      break;
  }

  const bodyMaxHeight = Math.max(120, maxHeight - HEADER_HEIGHT);

  return { width, maxHeight, bodyMaxHeight, marginH };
}

export function OrblyDialog({
  visible,
  onClose,
  title,
  children,
  size = "md",
  headerLeft,
  headerRight,
  scroll = false,
  cardStyle,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: DialogSize;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  scroll?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const layout = useMemo(
    () => computeLayout(size, windowWidth, windowHeight, insets),
    [size, windowWidth, windowHeight, insets.top, insets.bottom],
  );

  const hasHeader = !!(title || headerLeft || headerRight);

  const body = scroll ? (
    <ScrollView
      style={{ maxHeight: layout.bodyMaxHeight }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={layout.bodyMaxHeight > 200}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.bodySlot, { maxHeight: layout.bodyMaxHeight }]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: layout.marginH,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.center}
          pointerEvents="box-none"
        >
          <DialogLayoutContext.Provider value={layout}>
            <View
              style={[
                styles.card,
                {
                  width: layout.width,
                  maxHeight: layout.maxHeight,
                },
                cardStyle,
              ]}
            >
              {hasHeader ? (
                <View style={styles.header}>
                  <View style={styles.headerSide}>{headerLeft}</View>
                  {title ? (
                    <Text style={styles.title} numberOfLines={1}>
                      {title}
                    </Text>
                  ) : (
                    <View style={styles.titleSpacer} />
                  )}
                  <View style={[styles.headerSide, styles.headerSideRight]}>
                    {headerRight}
                  </View>
                </View>
              ) : null}
              {body}
            </View>
          </DialogLayoutContext.Provider>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function DialogHeaderButton({
  label,
  onPress,
  disabled,
  accent,
  destructive,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={10}>
      <Text
        style={[
          styles.headerBtn,
          accent && styles.headerBtnAccent,
          destructive && styles.headerBtnDestructive,
          disabled && styles.headerBtnDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
  },
  center: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: OrblyColors.bgPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    overflow: "hidden",
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    gap: 6,
  },
  headerSide: { width: 72, justifyContent: "center" },
  headerSideRight: { alignItems: "flex-end" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: OrblyColors.textPrimary,
  },
  titleSpacer: { flex: 1 },
  bodySlot: {
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  headerBtn: {
    fontSize: 16,
    color: OrblyColors.textSecondary,
    fontWeight: "600",
  },
  headerBtnAccent: { color: OrblyColors.accent },
  headerBtnDestructive: { color: OrblyColors.like },
  headerBtnDisabled: { opacity: 0.4 },
});
