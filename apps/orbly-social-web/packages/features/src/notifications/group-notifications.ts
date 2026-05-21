import type { NotificationItem, NotificationType, UserPublic } from "@orbly/types";

const GROUPABLE: NotificationType[] = ["like", "repost"];

export type NotificationGroup = {
  id: string;
  type: NotificationType;
  postId: string | null;
  postPreview: NotificationItem["postPreview"];
  actors: UserPublic[];
  items: NotificationItem[];
  isRead: boolean;
  createdAt: string;
};

export type NotificationFeedEntry =
  | { kind: "single"; item: NotificationItem }
  | { kind: "group"; group: NotificationGroup };

function groupKey(n: NotificationItem): string | null {
  if (!GROUPABLE.includes(n.type)) return null;
  const postKey = n.postId ?? n.postPreview?.threadRootId ?? n.postPreview?.id;
  if (!postKey) return null;
  return `${n.type}:${postKey}`;
}

export function groupNotifications(items: NotificationItem[]): NotificationFeedEntry[] {
  const out: NotificationFeedEntry[] = [];

  for (const item of items) {
    const key = groupKey(item);
    const prev = out[out.length - 1];

    if (
      key &&
      prev?.kind === "group" &&
      groupKey(prev.group.items[0]!) === key &&
      prev.group.type === item.type
    ) {
      const g = prev.group;
      const actors = [...g.actors];
      if (item.actor && !actors.some((a) => a.id === item.actor!.id)) {
        actors.push(item.actor);
      }
      prev.group = {
        ...g,
        actors,
        items: [...g.items, item],
        isRead: g.isRead && item.isRead,
        createdAt: item.createdAt > g.createdAt ? item.createdAt : g.createdAt,
      };
      continue;
    }

    if (key) {
      out.push({
        kind: "group",
        group: {
          id: `group-${key}-${item.id}`,
          type: item.type,
          postId: item.postId,
          postPreview: item.postPreview,
          actors: item.actor ? [item.actor] : [],
          items: [item],
          isRead: item.isRead,
          createdAt: item.createdAt,
        },
      });
    } else {
      out.push({ kind: "single", item });
    }
  }

  return out;
}

export function getGroupedHeadline(group: NotificationGroup): string {
  const names = group.actors.map((a) => a.displayName);
  const first = names[0] ?? "Birisi";
  const isReplyLike = !!group.postPreview?.replyToId;
  const action =
    group.type === "like"
      ? isReplyLike
        ? "yanıtını beğendi"
        : "gönderini beğendi"
      : group.type === "repost"
        ? "gönderini yeniden paylaştı"
        : "etkileşime geçti";

  if (names.length === 1) return `${first} ${action}`;
  if (names.length === 2) return `${first} ve ${names[1]} ${action}`;
  return `${first} ve ${names.length - 1} diğer kişi ${action}`;
}

export function getNotificationEntryIds(entry: NotificationFeedEntry): string[] {
  return entry.kind === "single"
    ? [entry.item.id]
    : entry.group.items.map((i) => i.id);
}

/** Grup bildiriminde tek id verildiğinde aynı gruptaki tüm kayıtları döner */
export function expandNotificationIdsForRead(
  items: NotificationItem[],
  notificationIds: string[],
): string[] {
  const out = new Set(notificationIds);
  for (const id of notificationIds) {
    const n = items.find((x) => x.id === id);
    if (!n) continue;
    const key = groupKey(n);
    if (!key) continue;
    for (const x of items) {
      if (groupKey(x) === key) out.add(x.id);
    }
  }
  return Array.from(out);
}

export function isNotificationEntryUnread(entry: NotificationFeedEntry): boolean {
  return entry.kind === "single" ? !entry.item.isRead : !entry.group.isRead;
}
