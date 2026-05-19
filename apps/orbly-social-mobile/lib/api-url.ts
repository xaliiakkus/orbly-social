import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Fiziksel cihaz / emülatörde localhost API'ye ulaşılamaz.
 * EXPO_PUBLIC_API_URL=http://localhost:4000 ise Expo packager IP'sine çevirir.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
  const trimmed = raw.replace(/\/$/, "");

  if (!/localhost|127\.0\.0\.1/i.test(trimmed)) {
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
    if (
      /localhost|127\.0\.0\.1/i.test(target.hostname) &&
      !/localhost|127\.0\.0\.1/i.test(baseUrl.hostname)
    ) {
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
