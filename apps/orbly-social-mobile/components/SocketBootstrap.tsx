import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket, reconnectSocket } from "@/lib/socket";
import { ensureFreshAccessToken } from "@/lib/token-manager";

/** Yalnızca oturum açıkken socket bağlanır (anonim bağlantı user odasına girmez). */
export function SocketBootstrap() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated || !accessToken) return;

    let socket: ReturnType<typeof getSocket> | null = null;
    const onConnectError = () => {
      void ensureFreshAccessToken().then((token) => {
        if (token) reconnectSocket();
      });
    };

    void ensureFreshAccessToken().then((token) => {
      if (!token) return;
      socket = getSocket(token);
      socket.on("connect_error", onConnectError);
    });

    return () => {
      socket?.off("connect_error", onConnectError);
    };
  }, [hydrated, accessToken]);

  return null;
}
