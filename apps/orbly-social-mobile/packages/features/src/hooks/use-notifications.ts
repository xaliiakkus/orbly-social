import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import type { NotificationItem } from "@orbly/types";

import { useApi, useOrblyQueryClient } from "../context";
import {
  fetchNotificationsPage,
  getNextNotificationsPageParam,
  NOTIFICATIONS_FEED_STALE_MS,
  NOTIFICATIONS_QUERY_KEY,
  seedNotificationsFeedIfEmpty,
} from "../notifications/notifications-feed-query";
import {
  markNotificationsReadInCache,
  setNotificationUnreadCount,
  subscribeNotificationUnread,
  syncUnreadCountFromNotificationCache,
} from "../realtime/notification-cache";

export function useNotificationsFeed(options?: { enabled?: boolean }) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchNotificationsPage(api, qc, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextNotificationsPageParam,
    enabled: options?.enabled ?? true,
    staleTime: NOTIFICATIONS_FEED_STALE_MS,
    refetchOnMount: true,
  });
}

/** Sekme rozeti — socket setQueryData ile anında güncellenir */
export function useNotificationUnreadCount(options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
}) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  const enabled = options?.enabled ?? true;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubCache = qc.getQueryCache().subscribe(onStoreChange);
      const unsubUnread = subscribeNotificationUnread(onStoreChange);
      return () => {
        unsubCache();
        unsubUnread();
      };
    },
    [qc],
  );

  const getSnapshot = useCallback(() => {
    const direct = qc.getQueryData<number>(["notifications", "unread-count"]);
    if (typeof direct === "number") return direct;
    const feed = qc.getQueryData<{ pages: Array<{ unreadCount: number }> }>(
      NOTIFICATIONS_QUERY_KEY,
    );
    const fromFeed = feed?.pages?.[0]?.unreadCount;
    if (typeof fromFeed === "number") return fromFeed;
    return 0;
  }, [qc]);

  const count = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.notifications.list();
        if (cancelled) return;
        seedNotificationsFeedIfEmpty(qc, res);
        setNotificationUnreadCount(qc, res.unreadCount);
      } catch {
        /* çevrimdışı */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, qc, enabled, options?.refetchOnMount]);

  return { data: count };
}

export function flattenNotifications(
  data: ReturnType<typeof useNotificationsFeed>["data"],
): NotificationItem[] {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

function normalizeReadIds(notificationIds: string | string[]): string[] {
  return Array.isArray(notificationIds) ? notificationIds : [notificationIds];
}

export function useMarkNotificationRead() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: async (notificationIds: string | string[]) => {
      const ids = normalizeReadIds(notificationIds);
      await Promise.all(ids.map((id) => api.notifications.read(id)));
    },
    onMutate: async (notificationIds) => {
      const prev = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (prev?.pages?.length) {
        await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      }
      const ids = normalizeReadIds(notificationIds);
      markNotificationsReadInCache(qc, ids);
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev);
        syncUnreadCountFromNotificationCache(qc);
      }
    },
    onSuccess: () => {
      syncUnreadCountFromNotificationCache(qc);
    },
  });
}

export function useReadAllNotifications() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.readAll(),
    onMutate: async () => {
      const prev = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (prev?.pages?.length) {
        await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        markNotificationsReadInCache(qc);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev);
        syncUnreadCountFromNotificationCache(qc);
      }
    },
    onSuccess: () => {
      setNotificationUnreadCount(qc, 0);
    },
  });
}

/** Bildirimler sekmesine girildiğinde rozeti sıfırla — feed yüklendikten sonra */
export function useNotificationsMarkSeenOnVisit(enabled = true) {
  const qc = useOrblyQueryClient();
  const { mutate } = useReadAllNotifications();
  const markedThisVisitRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tryMarkSeen = () => {
      if (markedThisVisitRef.current) return true;
      const feed = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (!feed?.pages?.length) return false;
      markedThisVisitRef.current = true;
      mutate(undefined);
      return true;
    };

    if (tryMarkSeen()) return;

    return qc.getQueryCache().subscribe(() => {
      tryMarkSeen();
    });
  }, [enabled, mutate, qc]);
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
