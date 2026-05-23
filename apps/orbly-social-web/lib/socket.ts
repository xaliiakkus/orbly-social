"use client";

import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "./api-url";

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

export function subscribeSocketLifecycle(listener: () => void): () => void {
  lifecycleListeners.add(listener);
  return () => {
    lifecycleListeners.delete(listener);
  };
}

export function getSocket(accessToken?: string | null): Socket {
  const token = authTokenKey(accessToken);
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
    bumpSocketLifecycle();
  } else if (token && !socket.connected) {
    socket.connect();
  }

  return socket;
}

/** Token yenilemede koparmadan auth güncelle; tam kopma yalnızca çıkışta */
export function reconnectSocket(accessToken?: string | null) {
  const token = authTokenKey(accessToken);
  if (!token) {
    disconnectSocket();
    return;
  }
  const prev = boundToken;
  const s = getSocket(token);
  if (!s.connected) s.connect();
  if (prev !== token) bumpSocketLifecycle();
}

export function waitForSocketConnection(
  sock: Socket = getSocket(),
  timeoutMs = 12_000,
): Promise<void> {
  if (sock.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Socket bağlantı zaman aşımı"));
    }, timeoutMs);
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Socket bağlanamadı"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      sock.off("connect", onConnect);
      sock.off("connect_error", onError);
    };
    sock.once("connect", onConnect);
    sock.once("connect_error", onError);
    if (!sock.connected) sock.connect();
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  boundToken = null;
  bumpSocketLifecycle();
}
