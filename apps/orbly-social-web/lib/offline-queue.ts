import type { OfflineAction, OfflineQueueBridge, OfflineStore } from "@orbly/features";
import { enqueueOfflineItem, flushOfflineQueue, isBrowserOffline } from "@orbly/features";

import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { webOfflineStore } from "@/lib/offline-store";

const pendingListeners = new Set<() => void>();

function notifyPending() {
  pendingListeners.forEach((fn) => fn());
}

export function subscribeOfflinePending(listener: () => void) {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

export function createOfflineQueueBridge(
  store: OfflineStore,
  getUserId: () => string | null,
): OfflineQueueBridge {
  return {
    isOffline: isBrowserOffline,
    async enqueue(action: OfflineAction) {
      const userId = getUserId();
      if (!userId) throw new Error("Oturum gerekli");
      await enqueueOfflineItem(store, userId, action);
      notifyPending();
    },
    async getPendingCount() {
      const userId = getUserId();
      if (!userId) return 0;
      return (await store.load(userId)).length;
    },
  };
}

export const webOfflineQueue = createOfflineQueueBridge(webOfflineStore, () =>
  useAuthStore.getState().user?.id ?? null,
);

export async function flushWebOfflineQueue(queryClient: import("@tanstack/react-query").QueryClient) {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return { synced: 0, remaining: 0, failed: false };
  const result = await flushOfflineQueue(webOfflineStore, userId, api, queryClient);
  notifyPending();
  return result;
}
