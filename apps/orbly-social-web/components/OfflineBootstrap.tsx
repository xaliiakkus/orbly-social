"use client";

import { useOfflineSync } from "@orbly/features";
import { useEffect, useState } from "react";

import { subscribeOfflinePending, webOfflineQueue } from "@/lib/offline-queue";

function useOfflinePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      void webOfflineQueue.getPendingCount().then(setCount);
    };
    refresh();
    return subscribeOfflinePending(refresh);
  }, []);

  return count;
}

/** Çevrimdışı kuyruk senkronu + üst bilgi şeridi */
export function OfflineBootstrap() {
  useOfflineSync();
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );
  const pending = useOfflinePendingCount();

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline && pending === 0) return null;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-[13px] font-semibold bg-amber-500/95 text-black border-b border-amber-600/40"
    >
      {offline
        ? pending > 0
          ? `Çevrimdışısın — ${pending} işlem bağlantı gelince gönderilecek`
          : "Çevrimdışısın — beğeni, yorum ve mesajlar kaydedilir"
        : `Senkronize ediliyor… (${pending} bekleyen işlem)`}
    </div>
  );
}
