import { createApiClient, socketRpc } from "@orbly/api-client";

import { getApiBaseUrl } from "./api-url";
import { useAuthStore } from "./auth-store";
import { notifySessionTokensRefreshed } from "./session-token-sync";
import {
  applyAuthTokens,
  ensureFreshAccessToken,
  refreshTokensSilently,
} from "./token-manager";
import { getSocket, reconnectSocket } from "./socket";

const baseUrl = getApiBaseUrl();

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
    const token = useAuthStore.getState().accessToken;
    return socketRpc(getSocket(token), action, data);
  },
});
