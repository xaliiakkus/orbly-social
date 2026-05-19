import type { SavedDeviceAccount } from "@/lib/device-accounts-store";
import { api, withoutUnauthorizedLogout } from "@/lib/api";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { applyAccountSession } from "@/lib/switch-account";
import { useAuthStore } from "@/lib/auth-store";

/** Kayıtlı hesabı geri yükle; 401'de logout etmez, önce refresh dener. */
export async function restoreSavedAccount(account: SavedDeviceAccount): Promise<boolean> {
  if (!account.accessToken) return false;

  applyAccountSession(account);

  return withoutUnauthorizedLogout(async () => {
    if (account.refreshToken) {
      try {
        const refreshed = await api.auth.refresh(account.refreshToken);
        useAuthStore.getState().setAuth(refreshed);
        useDeviceAccountsStore.getState().upsertAccount({
          userId: refreshed.user.id,
          user: refreshed.user,
          accessToken: refreshed.tokens.accessToken,
          refreshToken: refreshed.tokens.refreshToken,
          savedAt: new Date().toISOString(),
        });
        return true;
      } catch {
        /* access token ile dene */
      }
    }

    try {
      const fresh = await api.auth.me();
      useAuthStore.getState().setUser(fresh.user);
      const { accessToken, refreshToken } = useAuthStore.getState();
      useDeviceAccountsStore.getState().upsertAccount({
        ...account,
        user: fresh.user,
        accessToken: accessToken ?? account.accessToken,
        refreshToken: refreshToken ?? account.refreshToken,
        savedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      /* kayıtlı kullanıcı + token ile devam */
      return useAuthStore.getState().isAuthenticated();
    }
  });
}
