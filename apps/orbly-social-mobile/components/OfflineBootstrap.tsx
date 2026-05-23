import { useOfflineSync } from "@orbly/features";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrblyColors } from "@/constants/Colors";
import { mobileOfflineQueue, subscribeOfflinePending } from "@/lib/offline-queue";

function useOfflinePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      void mobileOfflineQueue.getPendingCount().then(setCount);
    };
    refresh();
    return subscribeOfflinePending(refresh);
  }, []);

  return count;
}

export function OfflineBootstrap() {
  useOfflineSync();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false,
  );
  const pending = useOfflinePendingCount();

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    if (typeof window !== "undefined" && "addEventListener" in window) {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }
    return undefined;
  }, []);

  if (!offline && pending === 0) return null;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.text}>
        {offline
          ? pending > 0
            ? `Çevrimdışı — ${pending} işlem sırada`
            : "Çevrimdışı — işlemler kaydedilir"
          : `Senkronize ediliyor… (${pending})`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#f59e0b",
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  text: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
});
