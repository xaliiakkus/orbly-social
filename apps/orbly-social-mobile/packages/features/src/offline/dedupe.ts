import type { OfflineAction, OfflineQueueItem } from "./types";

function actionKey(action: OfflineAction): string | null {
  switch (action.type) {
    case "posts.like":
    case "posts.unlike":
      return `like:${action.postId}`;
    case "users.follow":
    case "users.unfollow":
      return `follow:${action.userId}`;
    default:
      return null;
  }
}

/** Beğeni/takip için son durum kalır; gönderi ve mesajlar sırayla gider */
export function dedupeOfflineQueue(items: OfflineQueueItem[]): OfflineQueueItem[] {
  const latestToggle = new Map<string, OfflineQueueItem>();
  const passthrough: OfflineQueueItem[] = [];

  for (const item of items) {
    const key = actionKey(item.action);
    if (key) latestToggle.set(key, item);
    else passthrough.push(item);
  }

  const toggles = Array.from(latestToggle.values()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );
  const merged = [...passthrough, ...toggles].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return merged;
}
