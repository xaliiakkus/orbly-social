import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemePresetId } from "@/lib/theme/presets";
import { syncWebTheme } from "@/lib/theme/sync-theme";

interface ThemeState {
  presetId: ThemePresetId;
  accentOverride: string | null;
  reduceMotion: boolean;
  setPresetId: (id: ThemePresetId) => void;
  setAccentOverride: (hex: string | null) => void;
  setReduceMotion: (enabled: boolean) => void;
  resetTheme: () => void;
}

function applyFromState(state: Pick<ThemeState, "presetId" | "accentOverride" | "reduceMotion">) {
  syncWebTheme(state.presetId, state.accentOverride, state.reduceMotion);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      presetId: "orbly-dark",
      accentOverride: null,
      reduceMotion: false,
      setPresetId: (presetId) => {
        const next = { presetId, accentOverride: null as string | null };
        set(next);
        applyFromState({ ...get(), ...next });
      },
      setAccentOverride: (accentOverride) => {
        set({ accentOverride });
        applyFromState({ ...get(), accentOverride });
      },
      setReduceMotion: (reduceMotion) => {
        set({ reduceMotion });
        applyFromState({ ...get(), reduceMotion });
      },
      resetTheme: () => {
        const next = {
          presetId: "orbly-dark" as ThemePresetId,
          accentOverride: null,
          reduceMotion: false,
        };
        set(next);
        applyFromState(next);
      },
    }),
    {
      name: "orbly-theme-v1",
      onRehydrateStorage: () => (state) => {
        if (state) applyFromState(state);
      },
    },
  ),
);
