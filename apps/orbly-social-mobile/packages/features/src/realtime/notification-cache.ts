import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { NotificationItem, PaginatedResponse } from "@orbly/types";

import { expandNotificationIdsForRead } from "../notifications/group-notifications";

export type NotificationSocketEvent = {
  id: string;
  type: NotificationItem["type"];
  postId?: string | null;
  isRead?: boolean;
  actor?: NotificationItem["actor"];
  createdAt?: string;
  postPreview?: NotificationItem["postPreview"];
  unreadCount?: number;
};

type NotificationPage = PaginatedResponse<NotificationItem> & {
  unreadCount: number;
};

export function setNotificationUnreadCount(qc: QueryClient, count: number) {
  qc.setQueryData(["notifications", "unread-count"], count);
}

export function bumpNotificationUnreadCount(qc: QueryClient, delta = 1) {
  qc.setQueryData<number>(["notifications", "unread-count"], (old) =>
    typeof old === "number" ? Math.max(0, old + delta) : delta,
  );
}

function flattenCachedNotifications(
  data: InfiniteData<NotificationPage> | undefined,
): NotificationItem[] {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

/** İlk sayfadaki unreadCount (API) rozeti günceller */
export function syncUnreadCountFromNotificationCache(qc: QueryClient) {
  const data = qc.getQueryData<InfiniteData<NotificationPage>>(["notifications"]);
  if (!data?.pages?.length) return;
  const first = data.pages[0];
  if (first && typeof first.unreadCount === "number") {
    setNotificationUnreadCount(qc, first.unreadCount);
    return;
  }
  const unread = flattenCachedNotifications(data).filter((n) => !n.isRead).length;
  setNotificationUnreadCount(qc, unread);
}

export function markNotificationsReadInCache(
  qc: QueryClient,
  notificationIds?: string[],
) {
  const prev = qc.getQueryData<InfiniteData<NotificationPage>>(["notifications"]);
  if (!prev?.pages?.length) return;

  const flat = flattenCachedNotifications(prev);
  const idSet = notificationIds
    ? new Set(expandNotificationIdsForRead(flat, notificationIds))
    : null;

  let totalMarked = 0;
  const pages = prev.pages.map((page) => {
    let pageMarked = 0;
    const data = page.data.map((n: NotificationItem) => {
      const shouldMark = !idSet || idSet.has(n.id);
      if (shouldMark && !n.isRead) {
        pageMarked += 1;
        return { ...n, isRead: true };
      }
      return n;
    });
    totalMarked += pageMarked;
    return { ...page, data };
  });

  const firstUnread = prev.pages[0]?.unreadCount ?? 0;
  qc.setQueryData<InfiniteData<NotificationPage>>(["notifications"], {
    ...prev,
    pages: pages.map((page, i) => ({
      ...page,
      unreadCount: !idSet
        ? 0
        : i === 0
          ? Math.max(0, firstUnread - totalMarked)
          : page.unreadCount,
    })),
  });

  syncUnreadCountFromNotificationCache(qc);
}

export function applyNotificationToCache(
  qc: QueryClient,
  raw: NotificationSocketEvent,
) {
  if (typeof raw.unreadCount === "number") {
    setNotificationUnreadCount(qc, raw.unreadCount);
  } else if (raw.isRead === false) {
    bumpNotificationUnreadCount(qc, 1);
  }

  const item: NotificationItem = {
    id: raw.id,
    type: raw.type,
    postId: raw.postId ?? null,
    isRead: raw.isRead ?? false,
    actor: raw.actor ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    postPreview: raw.postPreview ?? null,
  };

  const prev = qc.getQueryData<InfiniteData<NotificationPage>>(["notifications"]);
  if (!prev?.pages?.length) {
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    return;
  }

  if (prev.pages.some((p) => p.data.some((n: NotificationItem) => n.id === item.id))) {
    return;
  }

  qc.setQueryData<InfiniteData<NotificationPage>>(["notifications"], {
    ...prev,
    pages: prev.pages.map((page, i) =>
      i === 0
        ? {
            ...page,
            data: [item, ...page.data],
            unreadCount:
              typeof raw.unreadCount === "number"
                ? raw.unreadCount
                : page.unreadCount + (item.isRead ? 0 : 1),
          }
        : page,
    ),
  });
}
