import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ThemePresetId } from "@/lib/theme/presets";
import { zustandPersistStorage } from "@/lib/zustand-persist-storage";

interface ThemeState {
  presetId: ThemePresetId;
  accentOverride: string | null;
  reduceMotion: boolean;
  setPresetId: (id: ThemePresetId) => void;
  setAccentOverride: (hex: string | null) => void;
  setReduceMotion: (enabled: boolean) => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      presetId: "orbly-dark",
      accentOverride: null,
      reduceMotion: false,
      setPresetId: (presetId) => set({ presetId, accentOverride: null }),
      setAccentOverride: (accentOverride) => set({ accentOverride }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      resetTheme: () =>
        set({ presetId: "orbly-dark", accentOverride: null, reduceMotion: false }),
    }),
    { name: "orbly-theme-v1", storage: createJSONStorage(() => zustandPersistStorage) },
  ),
);
