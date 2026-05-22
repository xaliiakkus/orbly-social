/** E-posta / universal link içinden şifre sıfırlama token'ını çıkarır. */
export function extractResetTokenFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get("resetToken");
    return token?.trim() ? token.trim() : null;
  } catch {
    const match = url.match(/[?&]resetToken=([^&]+)/);
    if (!match?.[1]) return null;
    try {
      return decodeURIComponent(match[1]).trim() || null;
    } catch {
      return match[1].trim() || null;
    }
  }
}

export function parseRouteParam(
  value: string | string[] | undefined,
): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value.trim();
}
