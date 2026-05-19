import { getApiBaseUrl } from "@/lib/api-url";

/** API `/uploads/...` yollarını tam URL'ye çevirir. */
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
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (url.startsWith("/")) return `${base}${url}`;
  return url;
}
