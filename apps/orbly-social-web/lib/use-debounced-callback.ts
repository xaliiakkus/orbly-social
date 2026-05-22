"use client";

import { useCallback, useEffect, useRef } from "react";

/** Gecikmeli otomatik kayıt — her değişiklikte debounce ile tetiklenir */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delayMs: number,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingArgsRef.current;
    pendingArgsRef.current = null;
    if (pending !== null) {
      await fnRef.current(...pending);
      return;
    }
    await (fnRef.current as () => void | Promise<void>)();
  }, []);

  const schedule = useCallback(
    (...args: Args) => {
      pendingArgsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingArgsRef.current = null;
        void fnRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { schedule, flush, cancel: () => timerRef.current && clearTimeout(timerRef.current) };
}
