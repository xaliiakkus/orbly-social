import type { ApiClient } from "@orbly/api-client";
import type { QueryClient } from "@tanstack/react-query";

import { isQueueableError } from "./network";
import { dedupeOfflineQueue } from "./dedupe";
import { replayOfflineAction } from "./replay";
import {
  prependPendingPostToFeeds,
  replaceOfflinePostInFeeds,
  replacePendingMessage,
} from "./cache-optimistic";
import type { OfflineAction, OfflineQueueItem, OfflineStore } from "./types";

export function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function enqueueOfflineItem(
  store: OfflineStore,
  userId: string,
  action: OfflineAction,
): Promise<OfflineQueueItem> {
  const items = await store.load(userId);
  const item: OfflineQueueItem = {
    id: createClientId(),
    userId,
    action,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  await store.save(userId, items);
  return item;
}

export type FlushOfflineResult = {
  synced: number;
  remaining: number;
  failed: boolean;
};

export async function flushOfflineQueue(
  store: OfflineStore,
  userId: string,
  api: ApiClient,
  qc: QueryClient,
): Promise<FlushOfflineResult> {
  let items = dedupeOfflineQueue(await store.load(userId));
  let synced = 0;

  for (const item of items) {
    try {
      if (item.action.type === "posts.create") {
        const res = await api.posts.create(item.action.body);
        replaceOfflinePostInFeeds(qc, item.action.clientId, res.post);
      } else if (item.action.type === "conversations.send") {
        const res = await api.conversations.send(
          item.action.conversationId,
          item.action.content,
          item.action.mediaUrls,
        );
        replacePendingMessage(
          qc,
          item.action.conversationId,
          item.action.clientId,
          res.message,
        );
      } else {
        await replayOfflineAction(api, item.action);
      }
      items = items.filter((i) => i.id !== item.id);
      await store.save(userId, items);
      synced += 1;
    } catch (e) {
      if (isQueueableError(e)) {
        await store.save(userId, items);
        return { synced, remaining: items.length, failed: true };
      }
      items = items.filter((i) => i.id !== item.id);
      await store.save(userId, items);
    }
  }

  if (synced > 0) {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["profile-posts"] });
    void qc.invalidateQueries({ queryKey: ["conversations"] });
    void qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return { synced, remaining: items.length, failed: false };
}
