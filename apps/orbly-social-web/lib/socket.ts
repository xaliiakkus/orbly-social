"use client";

import { io, type Socket } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
