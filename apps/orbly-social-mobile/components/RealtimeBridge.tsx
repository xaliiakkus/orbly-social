import { useRealtimeSync } from "@orbly/features";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

/** Web RealtimeBridge karşılığı — global socket olayları → React Query */
export function RealtimeBridge() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [connectTick, setConnectTick] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const onConnect = () => setConnectTick((n) => n + 1);
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
    };
  }, [accessToken]);

  const getSocketStable = useCallback(() => {
    if (!accessToken) return null;
    return getSocket(accessToken);
  }, [accessToken, connectTick]);

  const getViewerId = useCallback(() => userId, [userId]);

  useRealtimeSync(getSocketStable, getViewerId);
  return null;
}
