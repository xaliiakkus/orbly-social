import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { syncMobileTheme } from "@/lib/theme/sync-theme";
import type { ThemePresetId } from "@/lib/theme/presets";
import { zustandPersistStorage } from "@/lib/zustand-persist-storage";

interface ThemeState {
  presetId: ThemePresetId;
  accentOverride: string | null;
  reduceMotion: boolean;
  /** StyleSheet yenileme — remount yerine hafif re-render */
  themeEpoch: number;
  setPresetId: (id: ThemePresetId) => void;
  setAccentOverride: (hex: string | null) => void;
  setReduceMotion: (enabled: boolean) => void;
  resetTheme: () => void;
}

function bumpEpoch(state: ThemeState, patch: Partial<ThemeState>): Partial<ThemeState> {
  const presetId = patch.presetId ?? state.presetId;
  const accentOverride =
    patch.accentOverride !== undefined ? patch.accentOverride : state.accentOverride;
  syncMobileTheme(presetId, accentOverride);
  return { ...patch, themeEpoch: state.themeEpoch + 1 };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      presetId: "orbly-dark",
      accentOverride: null,
      reduceMotion: false,
      themeEpoch: 0,
      setPresetId: (presetId) => set((s) => bumpEpoch(s, { presetId, accentOverride: null })),
      setAccentOverride: (accentOverride) => set((s) => bumpEpoch(s, { accentOverride })),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      resetTheme: () =>
        set((s) =>
          bumpEpoch(s, {
            presetId: "orbly-dark",
            accentOverride: null,
            reduceMotion: false,
          }),
        ),
    }),
    {
      name: "orbly-theme-v1",
      storage: createJSONStorage(() => zustandPersistStorage),
      onRehydrateStorage: () => (state) => {
        if (state) syncMobileTheme(state.presetId, state.accentOverride);
      },
    },
  ),
);
