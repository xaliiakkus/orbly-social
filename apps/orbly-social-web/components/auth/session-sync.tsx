"use client";

import { ApiError } from "@orbly/api-client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { registerSessionTokenSync } from "@/lib/session-token-sync";
import {
  applyAuthTokens,
  needsAccessRefresh,
  refreshTokensSilently,
  startProactiveRefresh,
  stopProactiveRefresh,
} from "@/lib/token-manager";
import { disconnectSocket, reconnectSocket } from "@/lib/socket";
import type { UserPublic } from "@orbly/types";

/** NextAuth oturumunu store + socket ile hizala. Çıkış yalnızca kullanıcı veya refresh token ölünce. */
export function SessionSync() {
  const { data: session, status, update } = useSession();
  const bootstrappedToken = useRef<string | null>(null);

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

    if (status === "unauthenticated") {
      bootstrappedToken.current = null;
      stopProactiveRefresh();
      useAuthStore.getState().logout();
      disconnectSocket();
      useAuthStore.getState().setHydrated(true);
      return;
    }

    if (!session?.accessToken || !session.orblyUser) {
      useAuthStore.getState().setHydrated(true);
      return;
    }

    const accessToken = session.accessToken;
    if (bootstrappedToken.current === accessToken && useAuthStore.getState().hydrated) {
      if (needsAccessRefresh()) {
        void refreshTokensSilently().then((payload) => {
          if (payload) {
            bootstrappedToken.current = payload.tokens.accessToken;
            void update({
              accessToken: payload.tokens.accessToken,
              refreshToken: payload.tokens.refreshToken,
              orblyUser: payload.user,
              accessExpiresAt: Date.now() + payload.tokens.expiresIn * 1000,
            });
            reconnectSocket(payload.tokens.accessToken);
          }
        });
      } else {
        reconnectSocket(accessToken);
      }
      return;
    }

    const user = session.orblyUser as unknown as UserPublic;
    const expiresAt =
      (session.accessExpiresAt as number | undefined) ??
      Date.now() + 15 * 60 * 1000;

    if (useDeviceAccountsStore.getState().wouldExceedLimit(user.id)) {
      sessionStorage.setItem("orbly-account-limit-error", "1");
      window.location.href = "/login?error=account_limit";
      return;
    }

    applyAuthTokens({
      user,
      tokens: {
        accessToken,
        refreshToken: session.refreshToken ?? "",
        expiresIn: Math.max(60, Math.floor((expiresAt - Date.now()) / 1000)),
      },
    });

    bootstrappedToken.current = accessToken;
    reconnectSocket(accessToken);

    startProactiveRefresh((payload) => {
      void update({
        accessToken: payload.tokens.accessToken,
        refreshToken: payload.tokens.refreshToken,
        orblyUser: payload.user,
        accessExpiresAt: Date.now() + payload.tokens.expiresIn * 1000,
      });
      reconnectSocket(payload.tokens.accessToken);
    });

    void withoutUnauthorizedLogout(async () => {
      if (needsAccessRefresh()) {
        const payload = await refreshTokensSilently();
        if (payload) {
          bootstrappedToken.current = payload.tokens.accessToken;
          void update({
            accessToken: payload.tokens.accessToken,
            refreshToken: payload.tokens.refreshToken,
            orblyUser: payload.user,
            accessExpiresAt: Date.now() + payload.tokens.expiresIn * 1000,
          });
        }
      }
      try {
        const fresh = await api.auth.me();
        useAuthStore.getState().setUser(fresh.user);
        useDeviceAccountsStore.getState().upsertAccount({
          userId: fresh.user.id,
          user: fresh.user,
          accessToken: useAuthStore.getState().accessToken ?? accessToken,
          refreshToken:
            useAuthStore.getState().refreshToken ?? session.refreshToken ?? "",
          savedAt: new Date().toISOString(),
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await signOut({ callbackUrl: "/login?error=session_expired" });
        }
      }
    });

    useAuthStore.getState().setHydrated(true);
  }, [
    session?.accessToken,
    session?.refreshToken,
    session?.orblyUser,
    session?.accessExpiresAt,
    status,
    update,
  ]);

  useEffect(() => () => stopProactiveRefresh(), []);

  return null;
}
