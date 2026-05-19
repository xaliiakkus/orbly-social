import { createApiClient, socketRpc } from "@orbly/api-client";

import { useAuthStore } from "./auth-store";
import { getSocket } from "./socket";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = createApiClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().logout(),
  rpc: (action, data) => {
    const token = useAuthStore.getState().accessToken;
    return socketRpc(getSocket(token), action, data);
  },
});
