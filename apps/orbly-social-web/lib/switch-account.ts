"use client";

import type { SavedDeviceAccount } from "@/lib/device-accounts-store";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

/** NextAuth session.update ile hesap değiştir */
export async function applyAccountSession(
  account: SavedDeviceAccount,
  update: (data: {
    accessToken: string;
    refreshToken: string;
    orblyUser: Record<string, unknown>;
  }) => Promise<unknown>,
) {
  await update({
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    orblyUser: account.user as unknown as Record<string, unknown>,
  });

  useAuthStore.getState().setAuth({
    user: account.user,
    tokens: {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresIn: 900,
    },
  });

  getSocket(account.accessToken);
}
