import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export type AutoSaveState = "idle" | "saving" | "saved" | "error";

export function AutoSaveStatus({
  state,
  error,
}: {
  state: AutoSaveState;
  error?: string;
}) {
  if (state === "idle" && !error) return null;

  return (
    <View style={styles.wrap}>
      {state === "saving" ? (
        <>
          <ActivityIndicator size="small" color={OrblyColors.accent} />
          <Text style={styles.muted}>Kaydediliyor…</Text>
        </>
      ) : null}
      {state === "saved" ? <Text style={styles.saved}>Kaydedildi</Text> : null}
      {state === "error" || error ? (
        <Text style={styles.error} numberOfLines={1}>
          {error ?? "Kaydedilemedi"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { fontSize: 13, fontWeight: "600", color: OrblyColors.textSecondary },
  saved: { fontSize: 13, fontWeight: "600", color: OrblyColors.repost },
  error: { fontSize: 13, fontWeight: "600", color: OrblyColors.like, maxWidth: 160 },
});
