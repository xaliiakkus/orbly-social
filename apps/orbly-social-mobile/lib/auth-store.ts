import type { AuthResponse, UserPublic } from "@orbly/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandPersistStorage } from "@/lib/zustand-persist-storage";

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number | null;
  hydrated: boolean;
  setAuth: (payload: AuthResponse, accessExpiresAt?: number) => void;
  setUser: (user: UserPublic) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      hydrated: false,
      setAuth: ({ user, tokens }, accessExpiresAt) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessExpiresAt:
            accessExpiresAt ?? Date.now() + tokens.expiresIn * 1000,
        }),
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          accessExpiresAt: null,
        }),
      isAuthenticated: () => !!get().accessToken || !!get().refreshToken,
    }),
    {
      name: "orbly-auth-mobile",
      storage: createJSONStorage(() => zustandPersistStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessExpiresAt: state.accessExpiresAt,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.getState().setHydrated(true);
      },
    },
  ),
);
