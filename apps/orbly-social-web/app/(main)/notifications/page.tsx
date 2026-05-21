"use client";

import { Bell } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { MobileMenuDrawer } from "@/components/layout/mobile-menu-drawer";
import { NotificationRow } from "@/components/notifications/notification-row";
import { NotificationTabs } from "@/components/notifications/notification-tabs";
import { NotificationsHeader } from "@/components/notifications/notifications-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import {
  filterNotificationEntries,
  flattenNotifications,
  getNotificationEntryIds,
  groupNotifications,
  useMarkNotificationRead,
  useNotificationsFeed,
  useNotificationsMarkSeenOnVisit,
  type NotificationFeedEntry,
  type NotificationTabId,
} from "@orbly/features";

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTabId>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useNotificationsFeed();
  const markRead = useMarkNotificationRead();
  useNotificationsMarkSeenOnVisit();

  const entries = useMemo(() => {
    const flat = flattenNotifications(data);
    return filterNotificationEntries(groupNotifications(flat), tab);
  }, [data, tab]);

  const onOpen = useCallback(
    (entry: NotificationFeedEntry) => {
      const unreadIds = getNotificationEntryIds(entry).filter((id) => {
        const item =
          entry.kind === "single"
            ? entry.item
            : entry.group.items.find((i) => i.id === id);
        return item && !item.isRead;
      });
      if (unreadIds.length) markRead.mutate(unreadIds);
    },
    [markRead],
  );

  return (
    <>
      <NotificationsHeader onMenuOpen={() => setMenuOpen(true)} />
      <NotificationTabs active={tab} onChange={setTab} />
      {isLoading && <PageLoading rows={6} />}
      {!isLoading && (
        <div className={isRefetching ? "opacity-70 transition-opacity" : undefined}>
          {entries.map((entry) => (
            <NotificationRow
              key={entry.kind === "single" ? entry.item.id : entry.group.id}
              entry={entry}
              onOpen={onOpen}
            />
          ))}
          {hasNextPage ? (
            <div className="py-4 flex justify-center border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
      {!isLoading && !entries.length && (
        <EmptyState
          icon={Bell}
          title={tab === "mentions" ? "Bahsetme yok" : "Bildirim yok"}
          description={
            tab === "mentions"
              ? "Senden bahsedildiğinde burada görünür."
              : "Beğeni, yanıt veya takip olduğunda burada görünür."
          }
        />
      )}
      {!isLoading && entries.length > 0 && (
        <div className="py-3 flex justify-center md:hidden">
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Yenile
          </Button>
        </div>
      )}
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
