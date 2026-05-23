import { createApiClient, socketRpc } from "@orbly/api-client";

import { getApiBaseUrl } from "./api-url";
import { useAuthStore } from "./auth-store";
import { notifySessionTokensRefreshed } from "./session-token-sync";
import {
  applyAuthTokens,
  ensureFreshAccessToken,
  needsAccessRefresh,
  refreshTokensSilently,
} from "./token-manager";
import { disconnectSocket, getSocket, reconnectSocket } from "./socket";

const baseUrl = getApiBaseUrl();

const PUBLIC_AUTH_ACTIONS = new Set([
  "auth.login",
  "auth.register",
  "auth.refresh",
  "auth.oauth",
]);

const DISCONNECT_SOCKET_ACTIONS = new Set(["auth.login", "auth.register", "auth.oauth"]);

let suppressUnauthorizedLogout = false;

export async function withoutUnauthorizedLogout<T>(
  fn: () => Promise<T>,
): Promise<T> {
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
  prepareAuth: async () => {
    if (needsAccessRefresh()) {
      await refreshTokensSilently();
    }
  },
  onTokensRefreshed: (payload) => {
    applyAuthTokens(payload);
    notifySessionTokensRefreshed(payload);
    reconnectSocket(payload.tokens.accessToken);
  },
  onUnauthorized: () => {
    if (suppressUnauthorizedLogout) return;
    void (async () => {
      const refreshed = await refreshTokensSilently();
      if (!refreshed) {
        await ensureFreshAccessToken();
      }
    })();
  },
  rpc: (action, data) => {
    const anonymous = PUBLIC_AUTH_ACTIONS.has(action);
    if (DISCONNECT_SOCKET_ACTIONS.has(action)) disconnectSocket();
    const token = anonymous ? null : useAuthStore.getState().accessToken;
    return socketRpc(getSocket(token), action, data ?? {});
  },
});
