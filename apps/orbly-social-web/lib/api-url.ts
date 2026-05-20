/** API tabanı — production'da HTTPS zorunlu (mixed content önleme). */
export function getApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );

  const forceHttps =
    process.env.NODE_ENV === "production" ||
    /api\.orbly\.social/i.test(url) ||
    (typeof window !== "undefined" && window.location.protocol === "https:");

  if (forceHttps) {
    url = url.replace(/^http:\/\//i, "https://");
  }

  return url;
}
