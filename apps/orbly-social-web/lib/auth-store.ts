"use client";

import type { AuthResponse, UserPublic } from "@orbly/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True after SessionSync has applied the session and refreshed user from the API. */
  hydrated: boolean;
  setAuth: (payload: AuthResponse) => void;
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
      hydrated: false,
      setAuth: ({ user, tokens }) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, hydrated: false }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: "orbly-auth" },
  ),
);
