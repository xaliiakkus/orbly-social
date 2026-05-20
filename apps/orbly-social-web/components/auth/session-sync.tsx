"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { registerSessionTokenSync } from "@/lib/session-token-sync";
import { disconnectSocket, getSocket } from "@/lib/socket";
import type { UserPublic } from "@orbly/types";

export function SessionSync() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    registerSessionTokenSync((payload) => {
      void update({
        accessToken: payload.tokens.accessToken,
        refreshToken: payload.tokens.refreshToken,
        orblyUser: payload.user,
        accessExpiresAt: Date.now() + payload.tokens.expiresIn * 1000,
      });
    });
  }, [update]);

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

      if (
        session?.error === "RefreshAccessTokenError" ||
        !session?.accessToken ||
        !session.orblyUser
      ) {
        store.logout();
        disconnectSocket();
        await signOut({ callbackUrl: "/login" });
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
        await withoutUnauthorizedLogout(async () => {
          const fresh = await api.auth.me();
          freshUser = fresh.user;
          if (!cancelled) store.setUser(fresh.user);
        });
      } catch {
        const refreshToken = session.refreshToken;
        if (refreshToken) {
          try {
            const refreshed = await withoutUnauthorizedLogout(() =>
              api.auth.refresh(refreshToken),
            );
            if (cancelled) return;
            store.setAuth(refreshed);
            freshUser = refreshed.user;
            await update({
              accessToken: refreshed.tokens.accessToken,
              refreshToken: refreshed.tokens.refreshToken,
              orblyUser: refreshed.user,
              accessExpiresAt: Date.now() + refreshed.tokens.expiresIn * 1000,
            });
            const fresh = await withoutUnauthorizedLogout(() => api.auth.me());
            freshUser = fresh.user;
            if (!cancelled) store.setUser(fresh.user);
          } catch {
            store.logout();
            disconnectSocket();
            await signOut({ callbackUrl: "/login" });
            if (!cancelled) store.setHydrated(true);
            return;
          }
        }
      }

      if (!cancelled) {
        useDeviceAccountsStore.getState().upsertAccount({
          userId: freshUser.id,
          user: freshUser,
          accessToken: useAuthStore.getState().accessToken ?? session.accessToken,
          refreshToken:
            useAuthStore.getState().refreshToken ?? session.refreshToken ?? "",
          savedAt: new Date().toISOString(),
        });
        sessionStorage.removeItem("orbly-add-account");
        sessionStorage.removeItem("orbly-add-account-return-user-id");
      }

      if (!cancelled) {
        store.setHydrated(true);
        getSocket(useAuthStore.getState().accessToken);
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [session, status, update]);

  return null;
}
