/** Paylaşılabilir gönderi URL’si (web origin veya prod varsayılanı). */
export function getPostShareUrl(postId: string, origin?: string) {
  const base = (
    origin ??
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL
      : undefined) ??
    "https://orbly.social"
  ).replace(/\/$/, "");
  return `${base}/post/${postId}`;
}
