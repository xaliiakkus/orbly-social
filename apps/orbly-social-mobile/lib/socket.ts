import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/lib/auth-store";

let socket: Socket | null = null;
let boundToken: string | null = null;

function authTokenKey(token: string | null | undefined): string | null {
  return token?.trim() ? token.trim() : null;
}

/**
 * Tek socket örneği; token değişince sunucuda `user:{id}` odasına yeniden girer.
 */
export function getSocket(accessToken?: string | null): Socket {
  const token = authTokenKey(accessToken ?? useAuthStore.getState().accessToken);
  const auth = token ? { token } : {};

  if (!socket) {
    socket = io(getApiBaseUrl(), {
      path: "/socket.io",
      auth,
      transports: ["websocket", "polling"],
      autoConnect: !!token,
    });
    boundToken = token;
    return socket;
  }

  const tokenChanged = boundToken !== token;
  socket.auth = auth;
  boundToken = token;

  if (tokenChanged) {
    if (socket.connected) socket.disconnect();
    if (token) socket.connect();
  } else if (token && !socket.connected) {
    socket.connect();
  }

  return socket;
}

/** Token değişince socket sıfırlanır — `user:{id}` odasına yeniden girer. */
export function reconnectSocket() {
  const token = authTokenKey(useAuthStore.getState().accessToken);
  disconnectSocket();
  if (token) getSocket(token);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  boundToken = null;
}
