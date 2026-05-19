import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ComposeFab } from "@/components/ComposeFab";
import { OrblyColors } from "@/constants/Colors";

/** Sekme ekranları: X arka plan + isteğe bağlı FAB */
export function TabScaffold({
  children,
  fab = true,
}: {
  children: ReactNode;
  fab?: boolean;
}) {
  return (
    <View style={styles.root}>
      {children}
      {fab ? <ComposeFab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
});
