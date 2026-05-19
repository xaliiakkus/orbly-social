import { useEffect, useRef } from "react";

import { SOCKET_SUBSCRIBE, SOCKET_UNSUBSCRIBE } from "../constants";
import type { RealtimeSocket } from "./types";

export function useSocketRooms(
  getSocket: () => RealtimeSocket | null,
  rooms: string[],
) {
  const roomsKey = rooms.filter(Boolean).sort().join(",");
  const getSocketRef = useRef(getSocket);
  getSocketRef.current = getSocket;

  useEffect(() => {
    const list = roomsKey ? roomsKey.split(",") : [];
    if (!list.length) return;

    const socket = getSocketRef.current();
    if (!socket) return;

    const subscribe = () => {
      socket.emit(SOCKET_SUBSCRIBE, { rooms: list });
    };

    if (socket.connected) subscribe();
    else socket.on("connect", subscribe);

    return () => {
      socket.off("connect", subscribe);
      socket.emit(SOCKET_UNSUBSCRIBE, { rooms: list });
    };
  }, [roomsKey]);
}
