"use client";

import { Check, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useSavedAccountsNotificationUnread } from "@orbly/features";

import { AccountLimitModal } from "@/components/auth/account-limit-modal";
import { Avatar } from "@/components/ui/avatar";
import { CountBadge } from "@/components/ui/count-badge";
import {
  MAX_DEVICE_ACCOUNTS,
  useDeviceAccountsStore,
} from "@/lib/device-accounts-store";
import { applyAccountSession } from "@/lib/switch-account";
import { clearAddAccountFlow, stashReturnUserId } from "@/lib/cancel-add-account";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-url";

export function AccountSwitcher({
  onClose,
  hideAddAccount,
  loginMode,
}: {
  onClose?: () => void;
  /** Giriş / hesap ekle sayfasında tekrar gösterme */
  hideAddAccount?: boolean;
  /** Giriş sayfası: kayıtlı hesaba (aktif dahil) tıklanınca oturuma geç */
  loginMode?: boolean;
}) {
  const router = useRouter();
  const { update } = useSession();
  const currentUser = useAuthStore((s) => s.user);
  const sessionToken = useAuthStore((s) => s.accessToken);
  const accounts = useDeviceAccountsStore((s) => s.accounts);
  const canAddNewAccount = useDeviceAccountsStore((s) => s.canAddNewAccount);
  const [limitOpen, setLimitOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const activeId = currentUser?.id;

  const handleSwitch = async (userId: string) => {
    if (switching) return;
    const account = accounts.find((a) => a.userId === userId);
    if (!account || !update) return;
    if (userId === activeId && !loginMode) return;

    setSwitching(userId);
    try {
      if (loginMode) {
        clearAddAccountFlow();
      }

      if (userId !== activeId || loginMode) {
        await applyAccountSession(account, update);
        try {
          const fresh = await api.auth.me();
          useDeviceAccountsStore.getState().upsertAccount({
            ...account,
            user: fresh.user,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            savedAt: new Date().toISOString(),
          });
          useAuthStore.getState().setUser(fresh.user);
        } catch {
          // kayıtlı oturumla devam
        }
      }

      onClose?.();
      const user = useAuthStore.getState().user;
      router.push(user?.onboarded ? "/home" : "/onboarding");
      router.refresh();
    } finally {
      setSwitching(null);
    }
  };

  const handleAddAccount = () => {
    if (!canAddNewAccount()) {
      setLimitOpen(true);
      return;
    }
    if (currentUser) {
      stashReturnUserId(currentUser.id);
    } else {
      sessionStorage.setItem("orbly-add-account", "1");
    }
    onClose?.();
    router.push("/login?addAccount=1");
  };

  const list = useMemo(() => {
    const base =
      accounts.length > 0
        ? accounts
        : currentUser
          ? [
              {
                userId: currentUser.id,
                user: currentUser,
                accessToken: "",
                refreshToken: "",
                savedAt: "",
              },
            ]
          : [];
    return base.map((a) => ({
      ...a,
      accessToken:
        a.userId === activeId && sessionToken ? sessionToken : a.accessToken,
    }));
  }, [accounts, currentUser, activeId, sessionToken]);

  const unreadByAccount = useSavedAccountsNotificationUnread(
    list.map((a) => ({ userId: a.userId, accessToken: a.accessToken })),
    activeId,
    getApiBaseUrl(),
    { enabled: list.length > 0 },
  );

  if (accounts.length === 0 && !currentUser) return null;

  return (
    <>
      <div className="px-3 py-2 border-b border-border">
        <p className="px-2 pb-2 text-[13px] font-bold text-text-secondary uppercase tracking-wide">
          Hesaplar ({list.length}/{MAX_DEVICE_ACCOUNTS})
        </p>
        <ul className="space-y-0.5">
          {list.map((acc) => {
            const active = acc.userId === activeId;
            return (
              <button
                key={acc.userId}
                type="button"
                disabled={!!switching}
                onClick={() => void handleSwitch(acc.userId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active ? "bg-bg-hover" : "hover:bg-bg-hover",
                  switching === acc.userId && "opacity-60",
                )}
              >
                <span className="relative shrink-0">
                  <Avatar
                    src={acc.user.avatarUrl}
                    name={acc.user.displayName}
                    size="sm"
                  />
                  <CountBadge
                    count={unreadByAccount[acc.userId] ?? 0}
                    variant="inline"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] leading-[18px] border-2 border-bg-primary"
                    ariaLabelPrefix="okunmamış bildirim"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[15px] truncate">{acc.user.displayName}</p>
                  <p className="text-text-secondary text-[13px] truncate">
                    @{acc.user.username}
                  </p>
                </div>
                {active && !loginMode && (
                  <Check className="h-5 w-5 text-accent shrink-0" />
                )}
                {switching === acc.userId && (
                  <span className="text-accent text-sm shrink-0">…</span>
                )}
              </button>
            );
          })}
        </ul>
        {!hideAddAccount && (
          <button
            type="button"
            onClick={handleAddAccount}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 mt-1 text-left hover:bg-bg-hover transition-colors text-accent font-bold text-[15px]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-accent/50">
              <Plus className="h-4 w-4" />
            </span>
            Başka hesap ekle
          </button>
        )}
      </div>

      <AccountLimitModal open={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  );
}
