import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import type { NotificationItem } from "@orbly/types";

import { useApi, useOrblyQueryClient } from "../context";
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
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const res = await api.notifications.list(pageParam as string | undefined);
      if (!pageParam && typeof res.unreadCount === "number") {
        setNotificationUnreadCount(qc, res.unreadCount);
      }
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    enabled: options?.enabled ?? true,
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
    const feed = qc.getQueryData<{ pages: Array<{ unreadCount: number }> }>(["notifications"]);
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
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(["notifications"]);
      const ids = normalizeReadIds(notificationIds);
      markNotificationsReadInCache(qc, ids);
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["notifications"], ctx.prev);
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
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<ReturnType<typeof useNotificationsFeed>["data"]>(["notifications"]);
      markNotificationsReadInCache(qc);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["notifications"], ctx.prev);
        syncUnreadCountFromNotificationCache(qc);
      }
    },
    onSuccess: () => {
      setNotificationUnreadCount(qc, 0);
    },
  });
}

/** Bildirimler sekmesine girildiğinde rozeti sıfırla (X benzeri) */
export function useNotificationsMarkSeenOnVisit(enabled = true) {
  const { mutate } = useReadAllNotifications();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    mutate(undefined, {
      onSettled: () => {
        ran.current = false;
      },
    });
  }, [enabled, mutate]);
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
