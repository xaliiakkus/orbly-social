"use client";

import type { AuthResponse } from "@orbly/types";

import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/lib/auth-store";

const API = getApiBaseUrl();

/** Access token süresi dolmadan ~90 sn önce yenile */
const REFRESH_BUFFER_MS = 90_000;

let refreshInFlight: Promise<AuthResponse | null> | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function applyAuthTokens(payload: AuthResponse): void {
  const accessExpiresAt = Date.now() + payload.tokens.expiresIn * 1000;
  useAuthStore.getState().setAuth(payload, accessExpiresAt);
}

export function needsAccessRefresh(): boolean {
  const { accessToken, accessExpiresAt } = useAuthStore.getState();
  if (!accessToken) return false;
  if (!accessExpiresAt) return true;
  return Date.now() >= accessExpiresAt - REFRESH_BUFFER_MS;
}

/**
 * Sessiz refresh. 401 → refresh token geçersiz (null).
 * Ağ/5xx → null döner ama mevcut token silinmez.
 */
export async function refreshTokensSilently(): Promise<AuthResponse | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 401 || res.status === 403) {
        return null;
      }
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      applyAuthTokens(data);
      return data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  if (!needsAccessRefresh()) {
    return useAuthStore.getState().accessToken;
  }
  await refreshTokensSilently();
  return useAuthStore.getState().accessToken;
}

export function startProactiveRefresh(
  onRefreshed?: (payload: AuthResponse) => void,
): void {
  stopProactiveRefresh();
  refreshInterval = setInterval(() => {
    if (!needsAccessRefresh()) return;
    void refreshTokensSilently().then((payload) => {
      if (payload) onRefreshed?.(payload);
    });
  }, 60_000);
}

export function stopProactiveRefresh(): void {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = null;
}
