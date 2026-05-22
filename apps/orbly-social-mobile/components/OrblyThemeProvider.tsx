import { useLayoutEffect, type ReactNode } from "react";

import { syncMobileTheme } from "@/lib/theme/sync-theme";
import { useThemeStore } from "@/lib/theme-store";

/** Tema persist + renk paleti; store setter'ları anında uygular */
export function ThemedAppRoot({ children }: { children: ReactNode }) {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  useThemeStore((s) => s.themeEpoch);

  useLayoutEffect(() => {
    syncMobileTheme(presetId, accentOverride);
  }, [presetId, accentOverride]);

  useLayoutEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      const s = useThemeStore.getState();
      syncMobileTheme(s.presetId, s.accentOverride);
      useThemeStore.setState({ themeEpoch: s.themeEpoch + 1 });
    });
    if (useThemeStore.persist.hasHydrated()) {
      const s = useThemeStore.getState();
      syncMobileTheme(s.presetId, s.accentOverride);
    }
    return unsub;
  }, []);

  return children;
}
