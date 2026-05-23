import type { OfflineQueueItem, OfflineStore } from "@orbly/features";

const DB_NAME = "orbly-offline";
const DB_VERSION = 1;
const STORE = "queues";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB-unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("idb-open"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error ?? new Error("idb-get"));
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("idb-put"));
  });
}

export const webOfflineStore: OfflineStore = {
  async load(userId) {
    try {
      const db = await openDb();
      const items = await idbGet<OfflineQueueItem[]>(db, userId);
      return items ?? [];
    } catch {
      return [];
    }
  },
  async save(userId, items) {
    const db = await openDb();
    await idbPut(db, userId, items);
  },
};
