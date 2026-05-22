import { createApiClient, socketRpc } from "@orbly/api-client";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "./auth-store";
import { applyAuthTokens, needsAccessRefresh, refreshTokensSilently } from "./token-manager";
import { disconnectSocket, getSocket } from "./socket";

/** Geçersiz token ile socket reddedilir; giriş RPC'leri anonim bağlantı kullanmalı. */
const PUBLIC_AUTH_ACTIONS = new Set([
  "auth.login",
  "auth.register",
  "auth.refresh",
  "auth.oauth",
]);

/** Yalnızca giriş/kayıt öncesi anonim RPC — mevcut oturum socket'ini koparma. */
const DISCONNECT_SOCKET_ACTIONS = new Set(["auth.login", "auth.register", "auth.oauth"]);

let suppressUnauthorizedLogout = false;

/** Kayıtlı hesaba geçerken 401'de oturumu silme (refresh denenecek). */
export async function withoutUnauthorizedLogout<T>(fn: () => Promise<T>): Promise<T> {
  suppressUnauthorizedLogout = true;
  try {
    return await fn();
  } finally {
    suppressUnauthorizedLogout = false;
  }
}

export const api = createApiClient({
  baseUrl: getApiBaseUrl(),
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  prepareAuth: async () => {
    if (needsAccessRefresh()) {
      await refreshTokensSilently();
    }
  },
  onTokensRefreshed: (payload) => {
    applyAuthTokens(payload);
  },
  onUnauthorized: () => {
    if (suppressUnauthorizedLogout) return;
    void refreshTokensSilently();
  },
  rpc: <T>(action: string, data?: Record<string, unknown>) => {
    const anonymous = PUBLIC_AUTH_ACTIONS.has(action);
    if (DISCONNECT_SOCKET_ACTIONS.has(action)) disconnectSocket();
    const token = anonymous ? null : useAuthStore.getState().accessToken;
    return socketRpc<T>(getSocket(token), action, data ?? {});
  },
});
