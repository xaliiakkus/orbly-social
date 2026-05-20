import { createApiClient, socketRpc } from "@orbly/api-client";
import { signOut } from "next-auth/react";

import { useAuthStore } from "./auth-store";
import { notifySessionTokensRefreshed } from "./session-token-sync";
import { disconnectSocket, getSocket } from "./socket";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let suppressUnauthorizedLogout = false;

/** Oturum yenileme sırasında 401'de store'u silme. */
export async function withoutUnauthorizedLogout<T>(fn: () => Promise<T>): Promise<T> {
  suppressUnauthorizedLogout = true;
  try {
    return await fn();
  } finally {
    suppressUnauthorizedLogout = false;
  }
}

export const api = createApiClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokensRefreshed: (payload) => {
    useAuthStore.getState().setAuth(payload);
    notifySessionTokensRefreshed(payload);
    disconnectSocket();
    getSocket(payload.tokens.accessToken);
  },
  onUnauthorized: () => {
    if (suppressUnauthorizedLogout) return;
    useAuthStore.getState().logout();
    void signOut({ callbackUrl: "/login" });
  },
  rpc: (action, data) => {
    const token = useAuthStore.getState().accessToken;
    return socketRpc(getSocket(token), action, data);
  },
});
