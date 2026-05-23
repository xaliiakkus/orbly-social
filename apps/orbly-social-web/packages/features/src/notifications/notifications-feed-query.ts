import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { NotificationItem, PaginatedResponse } from "@orbly/types";
import { useEffect } from "react";

import { useApi, useOrblyQueryClient } from "../context";
import { setNotificationUnreadCount } from "../realtime/notification-cache";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export type NotificationListPage = PaginatedResponse<NotificationItem> & {
  unreadCount: number;
};

export type NotificationsFeedData = InfiniteData<NotificationListPage>;

export type NotificationsListApi = {
  notifications: {
    list: (cursor?: string) => Promise<NotificationListPage>;
  };
};

export const NOTIFICATIONS_FEED_STALE_MS = 60_000;

export function getNextNotificationsPageParam(last: NotificationListPage) {
  return last.hasMore ? last.nextCursor ?? undefined : undefined;
}

export async function fetchNotificationsPage(
  api: NotificationsListApi,
  qc: QueryClient,
  pageParam?: string,
): Promise<NotificationListPage> {
  const res = await api.notifications.list(pageParam);
  if (!pageParam && typeof res.unreadCount === "number") {
    setNotificationUnreadCount(qc, res.unreadCount);
  }
  return res;
}

/** Rozet / prefetch listesi — feed önbelleği boşsa doldurur */
export function seedNotificationsFeedIfEmpty(
  qc: QueryClient,
  page: NotificationListPage,
  pageParam: string | undefined = undefined,
): boolean {
  const existing = qc.getQueryData<NotificationsFeedData>(NOTIFICATIONS_QUERY_KEY);
  if (existing?.pages?.length) return false;
  qc.setQueryData<NotificationsFeedData>(NOTIFICATIONS_QUERY_KEY, {
    pages: [page],
    pageParams: [pageParam],
  });
  return true;
}

export function prefetchNotificationsFeed(qc: QueryClient, api: NotificationsListApi) {
  return qc.prefetchInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchNotificationsPage(api, qc, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextNotificationsPageParam,
    staleTime: NOTIFICATIONS_FEED_STALE_MS,
  });
}

export function usePrefetchNotificationsFeed(enabled = true) {
  const api = useApi();
  const qc = useOrblyQueryClient();

  useEffect(() => {
    if (!enabled) return;
    void prefetchNotificationsFeed(qc, api);
  }, [enabled, api, qc]);
}
