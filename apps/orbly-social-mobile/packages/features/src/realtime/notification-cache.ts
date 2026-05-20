import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { NotificationItem, NotificationsListResponse } from "@orbly/types";

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

type NotificationPage = NotificationsListResponse;

export function setNotificationUnreadCount(qc: QueryClient, count: number) {
  qc.setQueryData(["notifications", "unread-count"], count);
}

export function bumpNotificationUnreadCount(qc: QueryClient, delta = 1) {
  qc.setQueryData<number>(["notifications", "unread-count"], (old) =>
    typeof old === "number" ? Math.max(0, old + delta) : delta,
  );
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

  if (prev.pages.some((p) => p.data.some((n) => n.id === item.id))) return;

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
