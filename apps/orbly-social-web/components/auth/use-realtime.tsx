"use client";

import { useRealtimeSync } from "@orbly/features";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

export function useRealtime() {
  const { data: session } = useSession();
  const getSocketStable = useCallback(() => {
    return getSocket(session?.accessToken ?? useAuthStore.getState().accessToken);
  }, [session?.accessToken]);

  useRealtimeSync(
    getSocketStable,
    () => useAuthStore.getState().user?.id ?? null,
  );
}
