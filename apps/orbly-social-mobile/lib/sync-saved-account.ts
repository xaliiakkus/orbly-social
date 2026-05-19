import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

/** Giriş sonrası hesabı cihaz listesine kaydet */
export async function syncCurrentAccountToDevice() {
  const { user, accessToken, refreshToken } = useAuthStore.getState();
  if (!user || !accessToken) return;

  if (useDeviceAccountsStore.getState().wouldExceedLimit(user.id)) {
    return false;
  }

  let freshUser = user;
  try {
    const fresh = await api.auth.me();
    freshUser = fresh.user;
    useAuthStore.getState().setUser(fresh.user);
  } catch {
    // keep session user
  }

  useDeviceAccountsStore.getState().upsertAccount({
    userId: freshUser.id,
    user: freshUser,
    accessToken,
    refreshToken: refreshToken ?? "",
    savedAt: new Date().toISOString(),
  });
  return true;
}
