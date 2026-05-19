"use client";

import type { UserPublic } from "@orbly/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_DEVICE_ACCOUNTS = 3;

export interface SavedDeviceAccount {
  userId: string;
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  savedAt: string;
}

interface DeviceAccountsState {
  accounts: SavedDeviceAccount[];
  upsertAccount: (account: SavedDeviceAccount) => void;
  removeAccount: (userId: string) => void;
  /** Yeni bir userId eklenirken limit aşılır mı? (zaten kayıtlıysa false) */
  wouldExceedLimit: (userId: string) => boolean;
  canAddNewAccount: () => boolean;
}

export const useDeviceAccountsStore = create<DeviceAccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      upsertAccount: (account) =>
        set((state) => {
          const rest = state.accounts.filter((a) => a.userId !== account.userId);
          return { accounts: [...rest, account] };
        }),
      removeAccount: (userId) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.userId !== userId),
        })),
      wouldExceedLimit: (userId) => {
        const { accounts } = get();
        if (accounts.some((a) => a.userId === userId)) return false;
        return accounts.length >= MAX_DEVICE_ACCOUNTS;
      },
      canAddNewAccount: () => get().accounts.length < MAX_DEVICE_ACCOUNTS,
    }),
    { name: "orbly-device-accounts" },
  ),
);
