"use client";

import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "./api-url";

const API = getApiBaseUrl();

let socket: Socket | null = null;

export function getSocket(accessToken?: string | null): Socket {
  const auth = accessToken ? { token: accessToken } : {};
  if (!socket) {
    socket = io(API, {
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

/** Token değişince kullanıcı odasına yeniden gir (canlı bildirimler için). */
export function reconnectSocket(accessToken?: string | null) {
  disconnectSocket();
  if (accessToken) getSocket(accessToken);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
