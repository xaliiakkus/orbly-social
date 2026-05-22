import type { ReactNode } from "react";
import { View } from "react-native";

import { ComposeFab } from "@/components/ComposeFab";
import { OrblyColors } from "@/constants/Colors";
import { useThemeStore } from "@/lib/theme-store";

/** Sekme ekranları: X arka plan + isteğe bağlı FAB */
export function TabScaffold({
  children,
  fab = true,
}: {
  children: ReactNode;
  fab?: boolean;
}) {
  useThemeStore((s) => s.themeEpoch);
  return (
    <View style={{ flex: 1, backgroundColor: OrblyColors.bgPrimary }}>
      {children}
      {fab ? <ComposeFab /> : null}
    </View>
  );
}
