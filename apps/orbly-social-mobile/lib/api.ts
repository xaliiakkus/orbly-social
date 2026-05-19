import { createApiClient, socketRpc } from "@orbly/api-client";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "./auth-store";
import { disconnectSocket, getSocket } from "./socket";

/** Geçersiz token ile socket reddedilir; giriş RPC'leri anonim bağlantı kullanmalı. */
const PUBLIC_AUTH_ACTIONS = new Set([
  "auth.login",
  "auth.register",
  "auth.refresh",
  "auth.oauth",
]);

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
  onUnauthorized: () => {
    if (suppressUnauthorizedLogout) return;
    useAuthStore.getState().logout();
    disconnectSocket();
  },
  rpc: (action, data) => {
    const anonymous = PUBLIC_AUTH_ACTIONS.has(action);
    if (anonymous) disconnectSocket();
    const token = anonymous ? null : useAuthStore.getState().accessToken;
    return socketRpc(getSocket(token), action, data ?? {});
  },
});
