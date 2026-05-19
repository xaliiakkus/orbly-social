import type { NotificationFeedEntry, NotificationGroup } from "./group-notifications";
import type { NotificationItem, NotificationType } from "@orbly/types";

export type NotificationTabId = "all" | "priority" | "mentions";

export const NOTIFICATION_TABS: ReadonlyArray<{ id: NotificationTabId; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "priority", label: "Öncelik" },
  { id: "mentions", label: "Bahsedenler" },
] as const;

const PRIORITY_TYPES: NotificationType[] = ["like", "reply", "repost", "follow"];

export function filterNotificationsByTab(
  items: NotificationItem[],
  tab: NotificationTabId,
): NotificationItem[] {
  if (tab === "all") return items;
  if (tab === "mentions") return items.filter((n) => n.type === "mention");
  return items.filter((n) => PRIORITY_TYPES.includes(n.type));
}

function entryType(entry: NotificationFeedEntry): NotificationType {
  return entry.kind === "single" ? entry.item.type : entry.group.type;
}

export function filterNotificationEntries(
  entries: NotificationFeedEntry[],
  tab: NotificationTabId,
): NotificationFeedEntry[] {
  if (tab === "all") return entries;
  if (tab === "mentions") return entries.filter((e) => entryType(e) === "mention");
  return entries.filter((e) => PRIORITY_TYPES.includes(entryType(e)));
}

export function getEntryHref(entry: NotificationFeedEntry): string | null {
  if (entry.kind === "single") return getNotificationHref(entry.item);
  const g = entry.group;
  if (g.type === "follow" && g.actors[0]) return `/profile/${g.actors[0].username}`;
  return getNotificationHref(g.items[0]!);
}

export type { NotificationFeedEntry, NotificationGroup };
export {
  getGroupedHeadline,
  getNotificationEntryIds,
  groupNotifications,
  isNotificationEntryUnread,
} from "./group-notifications";
export { formatReplyingToLine, getReplyingToLabel, notificationReplyTarget } from "./reply-target";

export type NotificationIconKind = "like" | "reply" | "repost" | "follow" | "mention" | "orbit" | "bell";

export function getNotificationIconKind(type: NotificationType): NotificationIconKind {
  switch (type) {
    case "like":
      return "like";
    case "reply":
      return "reply";
    case "repost":
      return "repost";
    case "follow":
      return "follow";
    case "mention":
      return "mention";
    case "orbit_invite":
      return "orbit";
    default:
      return "bell";
  }
}

export function getNotificationHeadline(n: NotificationItem): string {
  const name = n.actor?.displayName ?? "Birisi";
  switch (n.type) {
    case "like":
      return n.postPreview?.replyToId ? `${name} yanıtını beğendi` : `${name} gönderini beğendi`;
    case "reply":
      return `${name} yanıtladı`;
    case "repost":
      return `${name} gönderini yeniden paylaştı`;
    case "follow":
      return `${name} seni takip etti`;
    case "mention":
      return `${name} senden bahsetti`;
    case "orbit_invite":
      return `${name} seni bir orbit'e davet etti`;
    default:
      return `${name} seninle etkileşime geçti`;
  }
}

export function getNotificationHref(n: NotificationItem): string | null {
  if (n.type === "follow" && n.actor) return `/profile/${n.actor.username}`;
  const threadId = n.postPreview?.threadRootId ?? n.postId;
  if (threadId) return `/post/${threadId}`;
  if (n.actor) return `/profile/${n.actor.username}`;
  return null;
}

export function isReplyStyleNotification(n: NotificationItem): boolean {
  return n.type === "reply" && !!n.actor && !!n.postPreview?.content;
}

export function isFollowStyleNotification(n: NotificationItem): boolean {
  return n.type === "follow" && !!n.actor;
}

export function notificationShowsMediaThumb(n: NotificationItem): boolean {
  if (!n.postPreview?.mediaUrl) return false;
  return n.type === "like" || n.type === "repost" || n.type === "mention";
}
