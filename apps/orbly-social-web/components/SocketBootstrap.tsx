"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket, waitForSocketConnection } from "@/lib/socket";
import { ensureFreshAccessToken } from "@/lib/token-manager";

/** Oturum açıkken socket bağlantısı + connect_error yeniden denemesi */
export function SocketBootstrap() {
  const { status } = useSession();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (status !== "authenticated" || !hydrated || !accessToken) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const sock = getSocket(accessToken);

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

    sock.on("connect_error", onConnectError);
    if (!sock.connected) sock.connect();
    void waitForSocketConnection(sock, 12_000).catch(() => {
      /* HTTP fallback'ler devreye girer */
    });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      sock.off("connect_error", onConnectError);
    };
  }, [status, hydrated, accessToken]);

  return null;
}
