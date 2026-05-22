import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";
import { ensureFreshAccessToken } from "@/lib/token-manager";

/** Yalnızca oturum açıkken socket bağlanır (anonim bağlantı user odasına girmez). */
export function SocketBootstrap() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated || !accessToken) return;

    let socket: ReturnType<typeof getSocket> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const onConnectError = () => {
      if (retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void ensureFreshAccessToken().then((token) => {
          if (!token) return;
          const s = getSocket(token);
          if (!s.connected) s.connect();
        });
      }, 2500);
    };

    void ensureFreshAccessToken().then((token) => {
      if (!token) return;
      socket = getSocket(token);
      socket.on("connect_error", onConnectError);
    });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      socket?.off("connect_error", onConnectError);
    };
  }, [hydrated, accessToken]);

  return null;
}
