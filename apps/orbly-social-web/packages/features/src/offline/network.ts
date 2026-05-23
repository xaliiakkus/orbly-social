import { isRpcTransportError } from "@orbly/api-client";

/** İstek kuyruğa alınabilir mi? (ağ / socket) */
export function isQueueableError(error: unknown): boolean {
  if (isRpcTransportError(error)) return true;
  if (error instanceof TypeError) return true;
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("failed") ||
    msg.includes("timeout")
  );
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
