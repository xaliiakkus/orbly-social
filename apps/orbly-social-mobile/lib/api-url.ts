import Constants from "expo-constants";
import { Platform } from "react-native";

const PROD_API = "https://api.orbly.social";

/**
 * Fiziksel cihaz / release build localhost API'ye ulaşamaz.
 * EXPO_PUBLIC_API_URL yoksa: dev → localhost, release → api.orbly.social
 */
export function getApiBaseUrl(): string {
  const fallback = __DEV__ ? "http://localhost:4000" : PROD_API;
  let trimmed = (process.env.EXPO_PUBLIC_API_URL ?? fallback).replace(/\/$/, "");

  if (/api\.orbly\.social/i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  } else if (!__DEV__ && /^http:\/\//i.test(trimmed) && !isLocalHost(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  }

  if (!isLocalHost(trimmed)) {
    return trimmed;
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri?.split(":")[0] ??
    Constants.expoGoConfig?.debuggerHost?.split(":")[0];

  if (debuggerHost) {
    return trimmed.replace(/localhost|127\.0\.0\.1/gi, debuggerHost);
  }

  if (Platform.OS === "android") {
    return trimmed.replace(/localhost|127\.0\.0\.1/gi, "10.0.2.2");
  }

  return trimmed;
}

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url);
}

/** API'den gelen localhost URL'lerini cihazın erişebildiği host'a çevirir. */
export function resolveApiUrl(urlOrPath: string): string {
  const base = getApiBaseUrl();

  if (urlOrPath.startsWith("/")) {
    return `${base}${urlOrPath}`;
  }

  if (!/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  try {
    const target = new URL(urlOrPath);
    const baseUrl = new URL(base);
    if (isLocalHost(target.href) && !isLocalHost(base)) {
      target.hostname = baseUrl.hostname;
      target.port = baseUrl.port;
      target.protocol = baseUrl.protocol;
      return target.toString();
    }
  } catch {
    /* ignore */
  }

  return urlOrPath;
}
