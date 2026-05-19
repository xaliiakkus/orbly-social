"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { disconnectSocket, getSocket } from "@/lib/socket";
import type { UserPublic } from "@orbly/types";

export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    getSocket(session?.accessToken ?? null);
  }, [session?.accessToken, status]);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function sync() {
      const store = useAuthStore.getState();
      store.setHydrated(false);

      if (!session?.accessToken || !session.orblyUser) {
        store.logout();
        disconnectSocket();
        if (!cancelled) store.setHydrated(true);
        return;
      }

      const user = session.orblyUser as unknown as UserPublic;

      if (useDeviceAccountsStore.getState().wouldExceedLimit(user.id)) {
        sessionStorage.setItem("orbly-account-limit-error", "1");
        store.logout();
        disconnectSocket();
        await signOut({ redirect: false });
        if (!cancelled) {
          store.setHydrated(true);
          window.location.href = "/login?error=account_limit";
        }
        return;
      }

      store.setAuth({
        user,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? "",
          expiresIn: 900,
        },
      });

      let freshUser = user;
      try {
        const fresh = await api.auth.me();
        freshUser = fresh.user;
        if (!cancelled) store.setUser(fresh.user);
      } catch {
        // Keep session user if /me fails (offline, expired token, etc.)
      }

      if (!cancelled) {
        useDeviceAccountsStore.getState().upsertAccount({
          userId: freshUser.id,
          user: freshUser,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? "",
          savedAt: new Date().toISOString(),
        });
        sessionStorage.removeItem("orbly-add-account");
        sessionStorage.removeItem("orbly-add-account-return-user-id");
      }

      if (!cancelled) {
        store.setHydrated(true);
        getSocket(session.accessToken);
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  return null;
}
