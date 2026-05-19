import { useSocketRooms } from "@orbly/features";
import { useCallback } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

/** Web `useSocketRooms(getSocket, rooms)` karşılığı */
export function useMobileSocketRooms(rooms: string[]) {
  const getSocketStable = useCallback(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;
    return getSocket(token);
  }, []);
  useSocketRooms(getSocketStable, rooms);
}
