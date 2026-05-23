import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useOrbly } from "../context";

/** Çevrimiçi olunca veya uygulama ön plana gelince kuyruğu boşalt */
export function useOfflineSync() {
  const { flushOfflineQueue: flush } = useOrbly();
  const flushing = useRef(false);

  useEffect(() => {
    if (!flush) return;

    const run = () => {
      if (flushing.current) return;
      flushing.current = true;
      void flush().finally(() => {
        flushing.current = false;
      });
    };

    run();

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") run();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      appSub.remove();
    };
  }, [flush]);
}
