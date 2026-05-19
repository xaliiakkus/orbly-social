"use client";

import { useRealtime } from "@/components/auth/use-realtime";

export function RealtimeBridge() {
  useRealtime();
  return null;
}
