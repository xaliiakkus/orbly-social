import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/lib/auth-store";

let socket: Socket | null = null;
let boundToken: string | null = null;
let socketGeneration = 0;
const lifecycleListeners = new Set<() => void>();

function authTokenKey(token: string | null | undefined): string | null {
  return token?.trim() ? token.trim() : null;
}

function bumpSocketLifecycle() {
  socketGeneration += 1;
  lifecycleListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener */
    }
  });
}

export function getSocketGeneration(): number {
  return socketGeneration;
}

/** Socket yeniden bağlandığında RealtimeBridge dinleyicileri yeniden bağlar. */
export function subscribeSocketLifecycle(listener: () => void): () => void {
  lifecycleListeners.add(listener);
  return () => {
    lifecycleListeners.delete(listener);
  };
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

/**
 * Oturum/token yenilemede aynı socket örneğini koru (dinleyiciler kopmasın).
 * Tam kopma yalnızca çıkışta `disconnectSocket`.
 */
export function reconnectSocket(accessToken?: string | null) {
  const token = authTokenKey(accessToken ?? useAuthStore.getState().accessToken);
  if (!token) {
    disconnectSocket();
    return;
  }
  const s = getSocket(token);
  if (s.connected) s.disconnect();
  s.connect();
  bumpSocketLifecycle();
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  boundToken = null;
  bumpSocketLifecycle();
}
