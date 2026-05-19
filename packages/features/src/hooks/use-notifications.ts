import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationItem } from "@orbly/types";

import { useApi, useOrblyQueryClient } from "../context";

export function useNotificationsFeed(options?: { enabled?: boolean }) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => api.notifications.list(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    enabled: options?.enabled ?? true,
  });
}

/** Sekme rozeti — hafif meta sorgusu */
export function useNotificationUnreadCount(options?: { enabled?: boolean }) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const cached = qc.getQueryData<{ pages: Array<{ unreadCount: number }> }>(["notifications"]);
      if (cached?.pages[0]) return cached.pages[0].unreadCount;
      const res = await api.notifications.list();
      return res.unreadCount;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function flattenNotifications(
  data: ReturnType<typeof useNotificationsFeed>["data"],
): NotificationItem[] {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

export function useMarkNotificationRead() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => api.notifications.read(notificationId),
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(["notifications"]);
      if (prev) {
        qc.setQueryData(["notifications"], {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
            unreadCount: Math.max(
              0,
              page.unreadCount - (page.data.some((n) => n.id === notificationId && !n.isRead) ? 1 : 0),
            ),
          })),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useReadAllNotifications() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.readAll(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** @deprecated useNotificationsFeed */
export function useNotifications(options?: { enabled?: boolean }) {
  const feed = useNotificationsFeed(options);
  const first = feed.data?.pages[0];
  return {
    ...feed,
    data: first
      ? { data: first.data, unreadCount: first.unreadCount, hasMore: first.hasMore, nextCursor: first.nextCursor }
      : undefined,
    isLoading: feed.isLoading,
  };
}
