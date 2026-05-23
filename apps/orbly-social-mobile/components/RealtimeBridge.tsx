import {
  useOrblyQueryClient,
  usePrefetchNotificationsFeed,
  useRealtimeSync,
} from "@orbly/features";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { flushMobileOfflineQueue } from "@/lib/offline-queue";
import { getSocket, subscribeSocketLifecycle } from "@/lib/socket";

/** Web RealtimeBridge karşılığı — global socket olayları → React Query */
export function RealtimeBridge() {
  const qc = useOrblyQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [socketEpoch, setSocketEpoch] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    const bump = () => setSocketEpoch((n) => n + 1);
    const unsubLifecycle = subscribeSocketLifecycle(bump);
    const socket = getSocket(accessToken);
    const onConnect = () => {
      bump();
      void flushMobileOfflineQueue(qc);
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
  return null;
}
