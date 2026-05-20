import type { AuthResponse, UserPublic } from "@orbly/types";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const storage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

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
      storage: createJSONStorage(() => storage),
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
