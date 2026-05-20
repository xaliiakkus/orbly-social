import { getApiBaseUrl } from "./api-url";

const API_BASE = getApiBaseUrl();

/** Harici CDN / GIF / S3 — next/image proxy kullanma (400 ve yavaşlık) */
export function shouldBypassNextImageOptimizer(url: string): boolean {
  if (url.startsWith("blob:") || url.startsWith("data:")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

/** @deprecated use shouldBypassNextImageOptimizer */
export const shouldUseUnoptimizedImage = shouldBypassNextImageOptimizer;

export function isVideoMediaUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (/\.(mp4|webm|m3u8|mov)(\?|#|$)/i.test(u)) return true;
  if (/cloudinary\.com\/.*\/video\/upload\//i.test(u)) return true;
  return false;
}

/** API'den gelen `/uploads/...` yollarını tarayıcıda gösterilebilir URL'ye çevirir. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}
