import { useEffect } from "react";

import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { reconnectSocket } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";
import { useAuthStore } from "@/lib/auth-store";
import { startProactiveRefresh, stopProactiveRefresh } from "@/lib/token-manager";

export function AuthBootstrap() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.getState().setHydrated(true);
    }
    return useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.getState().setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !refreshToken) {
      stopProactiveRefresh();
      return;
    }

    reconnectSocket();
    startProactiveRefresh();

    void withoutUnauthorizedLogout(async () => {
      try {
        const { user } = await api.auth.me();
        useAuthStore.getState().setUser(user);
      } catch {
        /* geçici hata — çıkış yok */
      }
      void syncCurrentAccountToDevice();
    });

    return () => stopProactiveRefresh();
  }, [hydrated, refreshToken]);

  return null;
}
