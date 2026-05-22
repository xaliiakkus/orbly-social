import type { OrblyTheme } from "@orbly/features";
import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { useThemeStore } from "@/lib/theme-store";

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/** Tema değişince StyleSheet yeniden oluşturulur (anında görünüm) */
export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: OrblyTheme) => T,
): T {
  const themeEpoch = useThemeStore((s) => s.themeEpoch);
  return useMemo(() => StyleSheet.create(factory(OrblyColors)), [themeEpoch, factory]);
}
