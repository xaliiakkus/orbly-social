"use client";

import { useLayoutEffect } from "react";

import { syncWebTheme } from "@/lib/theme/sync-theme";
import { useThemeStore } from "@/lib/theme-store";

/** Kullanıcı tema tercihini CSS değişkenlerine uygular (paint öncesi) */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  const reduceMotion = useThemeStore((s) => s.reduceMotion);

  useLayoutEffect(() => {
    syncWebTheme(presetId, accentOverride, reduceMotion);
  }, [presetId, accentOverride, reduceMotion]);

  return children;
}
