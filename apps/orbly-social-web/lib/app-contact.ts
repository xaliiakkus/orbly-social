/** Uygulama iletişim — destek, şifre sıfırlama, hesap yardımı */
export const ORBLY_SUPPORT_EMAIL = "info@orbly.social";

export const ORBLY_SUPPORT_MAILTO = `mailto:${ORBLY_SUPPORT_EMAIL}`;

export function supportMailtoSubject(subject: string): string {
  return `${ORBLY_SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}`;
}
