import { DarkTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { useMemo, type ReactNode } from "react";

import { OrblyColors } from "@/constants/Colors";
import { useThemeStore } from "@/lib/theme-store";

/** React Navigation renkleri — tema seçiminde anında güncellenir */
export function DynamicNavTheme({ children }: { children: ReactNode }) {
  const themeEpoch = useThemeStore((s) => s.themeEpoch);

  const navTheme = useMemo<Theme>(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: OrblyColors.bgPrimary,
        card: OrblyColors.bgPrimary,
        text: OrblyColors.textPrimary,
        border: OrblyColors.border,
        primary: OrblyColors.accent,
      },
    }),
    [themeEpoch],
  );

  return <ThemeProvider value={navTheme}>{children}</ThemeProvider>;
}
