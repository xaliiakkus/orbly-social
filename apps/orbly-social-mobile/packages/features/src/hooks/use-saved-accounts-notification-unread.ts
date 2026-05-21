import { fetchNotificationsUnreadCount } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useNotificationUnreadCount } from "./use-notifications";

export type SavedAccountTokenRef = {
  userId: string;
  accessToken: string;
};

/** Hesap değiştiricide her kayıtlı hesap için bildirim sayısı */
export function useSavedAccountsNotificationUnread(
  accounts: SavedAccountTokenRef[],
  activeUserId: string | undefined,
  baseUrl: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const { data: activeUnread = 0 } = useNotificationUnreadCount({
    enabled: enabled && !!activeUserId,
    refetchOnMount: true,
  });

  const others = useMemo(
    () =>
      accounts.filter(
        (a) => a.accessToken && a.userId !== activeUserId,
      ),
    [accounts, activeUserId],
  );

  const othersKey = others
    .map((a) => a.userId)
    .sort()
    .join(",");

  const { data: otherCounts = {} } = useQuery({
    queryKey: ["notifications", "unread-count", "saved-accounts", othersKey, baseUrl],
    queryFn: async () => {
      const pairs = await Promise.all(
        others.map(async (a) => {
          const count = await fetchNotificationsUnreadCount(baseUrl, a.accessToken);
          return [a.userId, count] as const;
        }),
      );
      return Object.fromEntries(pairs) as Record<string, number>;
    },
    enabled: enabled && others.length > 0 && !!baseUrl,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return useMemo(() => {
    const out: Record<string, number> = { ...otherCounts };
    for (const a of accounts) {
      if (a.userId === activeUserId) {
        out[a.userId] = activeUnread;
      } else if (out[a.userId] === undefined) {
        out[a.userId] = 0;
      }
    }
    return out;
  }, [accounts, activeUserId, activeUnread, otherCounts]);
}
