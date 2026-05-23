import AsyncStorage from "@react-native-async-storage/async-storage";

import type { OfflineQueueItem, OfflineStore } from "@orbly/features";

const key = (userId: string) => `orbly-offline-queue:${userId}`;

export const mobileOfflineStore: OfflineStore = {
  async load(userId) {
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as OfflineQueueItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  async save(userId, items) {
    await AsyncStorage.setItem(key(userId), JSON.stringify(items));
  },
};
