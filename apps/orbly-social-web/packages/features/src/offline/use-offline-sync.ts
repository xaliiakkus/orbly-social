"use client";

import { useEffect, useRef } from "react";

import { useOrbly } from "../context";

/** Çevrimiçi olunca kuyruğu arka planda boşalt */
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

    if (typeof window === "undefined") return;
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [flush]);
}
