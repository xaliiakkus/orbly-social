import type { SavedDeviceAccount } from "@/lib/device-accounts-store";
import { useAuthStore } from "@/lib/auth-store";
import { reconnectSocket } from "@/lib/socket";

export function applyAccountSession(account: SavedDeviceAccount) {
  useAuthStore.getState().setAuth({
    user: account.user,
    tokens: {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresIn: 900,
    },
  });
  reconnectSocket(account.accessToken);
}
