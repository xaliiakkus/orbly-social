import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import type { ThemePresetId } from "@/lib/theme/presets";

export function syncWebTheme(
  presetId: ThemePresetId,
  accentOverride: string | null,
  reduceMotion: boolean,
) {
  if (typeof document === "undefined") return;
  applyThemeToDocument(presetId, accentOverride, { reduceMotion });
}
