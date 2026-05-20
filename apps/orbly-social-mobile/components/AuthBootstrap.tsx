import { useEffect } from "react";

import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { reconnectSocket } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";
import { useAuthStore } from "@/lib/auth-store";

/** Uygulama açılışında kayıtlı hesabı senkronize et ve token'ı yenile. */
export function AuthBootstrap() {
  const token = useAuthStore((s) => s.accessToken);
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
    if (!token) return;
    reconnectSocket();
    void syncCurrentAccountToDevice();
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return;

    let cancelled = false;

    void (async () => {
      try {
        await withoutUnauthorizedLogout(async () => {
          const { user } = await api.auth.me();
          if (!cancelled) useAuthStore.getState().setUser(user);
        });
      } catch {
        /* refresh veya logout api istemcisi tarafından yapılır */
      }
      if (!cancelled) void syncCurrentAccountToDevice();
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return null;
}
