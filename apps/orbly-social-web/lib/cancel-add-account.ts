"use client";

import { getSession } from "next-auth/react";

import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { applyAccountSession } from "@/lib/switch-account";

const RETURN_USER_KEY = "orbly-add-account-return-user-id";
const ADD_FLAG_KEY = "orbly-add-account";

export function stashReturnUserId(userId: string) {
  sessionStorage.setItem(RETURN_USER_KEY, userId);
  sessionStorage.setItem(ADD_FLAG_KEY, "1");
}

export function clearAddAccountFlow() {
  sessionStorage.removeItem(RETURN_USER_KEY);
  sessionStorage.removeItem(ADD_FLAG_KEY);
}

/** Hesap eklemeden vazgeç — önceki hesaba döner veya ana sayfaya yönlendirir */
export async function cancelAddAccount(
  update?: (data: {
    accessToken: string;
    refreshToken: string;
    orblyUser: Record<string, unknown>;
  }) => Promise<unknown>,
) {
  const returnId = sessionStorage.getItem(RETURN_USER_KEY);
  clearAddAccountFlow();

  const session = await getSession();
  const activeId = (session?.orblyUser as { id?: string } | undefined)?.id;

  if (returnId && activeId === returnId) {
    return { restored: true, path: "/home" as const };
  }

  if (returnId && update) {
    const account = useDeviceAccountsStore
      .getState()
      .accounts.find((a) => a.userId === returnId);
    if (account) {
      await applyAccountSession(account, update);
      return { restored: true, path: "/home" as const };
    }
  }

  if (session?.accessToken) {
    return { restored: false, path: "/home" as const };
  }

  return { restored: false, path: "/login" as const };
}
