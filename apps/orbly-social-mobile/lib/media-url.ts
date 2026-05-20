import { getApiBaseUrl } from "@/lib/api-url";

function upgradeToHttps(url: string): string {
  if (!url.startsWith("http://")) return url;
  return url.replace(/^http:\/\//i, "https://");
}

/** API `/uploads/...` yollarını tam URL'ye çevirir. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return upgradeToHttps(url);
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (url.startsWith("/")) return upgradeToHttps(`${base}${url}`);
  return url;
}
