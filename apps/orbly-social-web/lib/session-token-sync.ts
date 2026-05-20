import type { AuthResponse } from "@orbly/types";

let syncHandler: ((payload: AuthResponse) => void) | null = null;

export function registerSessionTokenSync(
  handler: (payload: AuthResponse) => void,
): void {
  syncHandler = handler;
}

export function notifySessionTokensRefreshed(payload: AuthResponse): void {
  syncHandler?.(payload);
}
