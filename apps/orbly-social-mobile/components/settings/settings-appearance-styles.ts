import type { OrblyTheme } from "@orbly/features";
import { StyleSheet } from "react-native";

export function createSettingsAppearanceStyles(c: OrblyTheme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.bgPrimary },
    hint: {
      padding: 16,
      fontSize: 15,
      color: c.textSecondary,
      lineHeight: 22,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      fontSize: 13,
      fontWeight: "800",
      color: c.textSecondary,
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      gap: 8,
    },
    card: {
      width: "47%",
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      minHeight: 88,
    },
    cardActive: { borderColor: c.accent, borderWidth: 2 },
    swatch: { width: 32, height: 32, borderRadius: 16, marginBottom: 8 },
    cardTitle: { fontSize: 14, fontWeight: "700" },
    check: { position: "absolute", top: 8, right: 8 },
    hexRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    hexInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: c.textPrimary,
      backgroundColor: c.bgSecondary,
      fontFamily: "monospace",
    },
    resetLink: { color: c.accent, fontWeight: "700", fontSize: 15 },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 18,
      marginBottom: 24,
    },
    resetText: { color: c.textSecondary, fontWeight: "600", fontSize: 15 },
  });
}
