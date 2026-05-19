import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** KeyboardAvoidingView offset — ScreenHeader + safe area */
export function useStackHeaderOffset() {
  const insets = useSafeAreaInsets();
  return insets.top + 61;
}

import { OrblyColors } from "@/constants/Colors";

/** X tarzı stack başlığı */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  largeTitle,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  largeTitle?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top },
        largeTitle && styles.barLarge,
      ]}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        style={styles.back}
      >
        <FontAwesome name="arrow-left" size={20} color={OrblyColors.textPrimary} />
      </Pressable>
      <View style={styles.center}>
        <Text
          style={[styles.title, largeTitle && styles.titleLarge]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && !largeTitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 53,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
  },
  barLarge: { minHeight: 56 },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, minWidth: 0, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: OrblyColors.textPrimary },
  titleLarge: { fontSize: 20 },
  subtitle: { fontSize: 13, color: OrblyColors.textSecondary, marginTop: 2 },
  right: {
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
