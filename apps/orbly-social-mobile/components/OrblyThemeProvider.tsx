import React, { useEffect, useState } from "react";

import { applyOrblyColors } from "@/lib/orbly-colors-runtime";
import { resolveThemeColors } from "@/lib/theme/resolve";
import { useThemeStore } from "@/lib/theme-store";

function syncColors() {
  const { presetId, accentOverride } = useThemeStore.getState();
  applyOrblyColors(resolveThemeColors(presetId, accentOverride));
}

/** Tema persist + renk uygulama; key ile alt ağaç remount */
export function ThemedAppRoot({ children }: { children: React.ReactNode }) {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  const [ready, setReady] = useState(useThemeStore.persist.hasHydrated());

  useEffect(() => {
    syncColors();
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      syncColors();
      setReady(true);
    });
    if (useThemeStore.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);

  useEffect(() => {
    syncColors();
  }, [presetId, accentOverride]);

  if (!ready) return null;

  return <React.Fragment key={`${presetId}-${accentOverride ?? ""}`}>{children}</React.Fragment>;
}
