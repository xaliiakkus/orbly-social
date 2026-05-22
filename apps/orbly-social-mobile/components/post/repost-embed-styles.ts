import type { OrblyTheme } from "@orbly/features";
import { StyleSheet } from "react-native";

export function createRepostEmbedStyles(c: OrblyTheme) {
  return StyleSheet.create({
    wrap: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: c.bgPrimary,
    },
    inner: { padding: 12 },
    head: { flexDirection: "row", alignItems: "center", gap: 8 },
    headText: { flex: 1, minWidth: 0 },
    nameMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: 4,
      rowGap: 2,
    },
    name: { color: c.textPrimary, fontWeight: "700", fontSize: 15, flexShrink: 1 },
    handle: { color: c.textSecondary, fontSize: 15, flexShrink: 1 },
    metaDot: { color: c.textSecondary, fontSize: 15 },
    metaTime: { color: c.textSecondary, fontSize: 15 },
    content: { marginTop: 4 },
    pollWrap: { marginTop: 8 },
    media: {
      marginTop: 8,
      width: "100%",
      height: 200,
      maxHeight: 256,
      borderRadius: 12,
      backgroundColor: c.bgSecondary,
    },
  });
}
