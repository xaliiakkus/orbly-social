"use client";

import { useEffect } from "react";

import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import { useThemeStore } from "@/lib/theme-store";

/** Kullanıcı tema tercihini CSS değişkenlerine uygular */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  const reduceMotion = useThemeStore((s) => s.reduceMotion);

  useEffect(() => {
    applyThemeToDocument(presetId, accentOverride, { reduceMotion });
  }, [presetId, accentOverride, reduceMotion]);

  return children;
}
