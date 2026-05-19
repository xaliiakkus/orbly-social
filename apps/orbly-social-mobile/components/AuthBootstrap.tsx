import { useEffect } from "react";

import { reconnectSocket } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";
import { useAuthStore } from "@/lib/auth-store";

/** Uygulama açılışında kayıtlı hesabı senkronize et */
export function AuthBootstrap() {
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.getState().setHydrated(true);
    }
    return useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.getState().setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    reconnectSocket();
    void syncCurrentAccountToDevice();
  }, [token]);

  return null;
}
