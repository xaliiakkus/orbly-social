"use client";

import {
  useOrblyQueryClient,
  usePrefetchNotificationsFeed,
  useRealtimeSync,
} from "@orbly/features";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { flushWebOfflineQueue } from "@/lib/offline-queue";
import { getSocket, subscribeSocketLifecycle } from "@/lib/socket";

export function useRealtime() {
  const qc = useOrblyQueryClient();
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
    const onConnect = () => {
      bump();
      void flushWebOfflineQueue(qc);
    };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      unsubLifecycle();
      socket.off("connect", onConnect);
    };
  }, [accessToken, qc]);

  const getSocketStable = useCallback(() => {
    if (!accessToken) return null;
    void socketEpoch;
    return getSocket(accessToken);
  }, [accessToken, socketEpoch]);

  const getViewerId = useCallback(() => userId, [userId]);

  useRealtimeSync(getSocketStable, getViewerId);
  usePrefetchNotificationsFeed(!!accessToken);
}
