"use client";

import { useCallback, useEffect, useRef } from "react";

/** Gecikmeli otomatik kayıt — her değişiklikte debounce ile tetiklenir */
export function useDebouncedCallback<T extends (...args: unknown[]) => void | Promise<void>>(
  fn: T,
  delayMs: number,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await fnRef.current();
  }, []);

  const schedule = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
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
