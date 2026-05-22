import { useEffect } from "react";

import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { migratePersistFromSecureStore } from "@/lib/migrate-persist-storage";
import { getSocket, waitForSocketConnection } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";
import { useAuthStore } from "@/lib/auth-store";
import {
  ensureFreshAccessToken,
  startProactiveRefresh,
  stopProactiveRefresh,
} from "@/lib/token-manager";

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

    startProactiveRefresh();

    void withoutUnauthorizedLogout(async () => {
      await migratePersistFromSecureStore();
      const token = await ensureFreshAccessToken();
      if (token) {
        try {
          await waitForSocketConnection(getSocket(token));
        } catch {
          /* API/socket geçici — HTTP fallback auth.me için */
        }
      }
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
