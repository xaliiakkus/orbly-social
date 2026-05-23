"use client";

import { usePrefetchNotificationsFeed, useRealtimeSync } from "@orbly/features";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket, subscribeSocketLifecycle } from "@/lib/socket";

export function useRealtime() {
  const { data: session } = useSession();
  const storeToken = useAuthStore((s) => s.accessToken);
  const accessToken = session?.accessToken ?? storeToken;
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [socketEpoch, setSocketEpoch] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    const bump = () => setSocketEpoch((n) => n + 1);
    const unsubLifecycle = subscribeSocketLifecycle(bump);
    const socket = getSocket(accessToken);
    socket.on("connect", bump);
    if (socket.connected) bump();
    return () => {
      unsubLifecycle();
      socket.off("connect", bump);
    };
  }, [accessToken]);

  const getSocketStable = useCallback(() => {
    if (!accessToken) return null;
    return getSocket(accessToken);
  }, [accessToken, socketEpoch]);

  const getViewerId = useCallback(() => userId, [userId]);

  useRealtimeSync(getSocketStable, getViewerId);
  usePrefetchNotificationsFeed(!!accessToken);
}
