import {
  filterNotificationEntries,
  flattenNotifications,
  getNotificationEntryIds,
  groupNotifications,
  NOTIFICATION_TABS,
  useMarkNotificationRead,
  useNotificationsFeed,
  useReadAllNotifications,
  type NotificationFeedEntry,
  type NotificationTabId,
} from "@orbly/features";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { MenuDrawer } from "@/components/MenuDrawer";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { TabScaffold } from "@/components/layout/TabScaffold";
import { XTabs } from "@/components/ui/XTabs";
import { OrblyColors } from "@/constants/Colors";

export default function NotificationsScreen() {
  const [tab, setTab] = useState<NotificationTabId>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useNotificationsFeed();
  const markRead = useMarkNotificationRead();
  const { mutate: markAllSeen } = useReadAllNotifications();

  useFocusEffect(
    useCallback(() => {
      markAllSeen();
    }, [markAllSeen]),
  );

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
    <TabScaffold>
      <View style={styles.container}>
        <NotificationsHeader onMenuOpen={() => setMenuOpen(true)} />
        <XTabs tabs={NOTIFICATION_TABS} active={tab} onChange={setTab} />
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => (e.kind === "single" ? e.item.id : e.group.id)}
            renderItem={({ item: entry }) => (
              <NotificationRow entry={entry} onOpen={onOpen} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={OrblyColors.accent}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={OrblyColors.accent} />
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                title={tab === "mentions" ? "Bahsetme yok" : "Bildirim yok"}
                description={
                  tab === "mentions"
                    ? "Senden bahsedildiğinde burada görünür."
                    : "Beğeni, yanıt veya takip olduğunda burada görünür."
                }
                icon="bell-o"
              />
            }
          />
        )}
        <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </View>
    </TabScaffold>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  loader: { marginTop: 32 },
  footer: { marginVertical: 16 },
});
