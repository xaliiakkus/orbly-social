import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/lib/auth-store";

let socket: Socket | null = null;

/**
 * Web `getSocket(accessToken)` ile aynı: giriş öncesi de socket açılır (public RPC).
 */
export function getSocket(accessToken?: string | null): Socket {
  const token = accessToken ?? useAuthStore.getState().accessToken;
  const auth = token ? { token } : {};

  if (!socket) {
    socket = io(getApiBaseUrl(), {
      path: "/socket.io",
      auth,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  } else {
    socket.auth = auth;
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function reconnectSocket() {
  const token = useAuthStore.getState().accessToken;
  socket?.disconnect();
  socket = null;
  getSocket(token);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
