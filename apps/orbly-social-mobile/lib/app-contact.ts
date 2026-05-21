/** Uygulama iletişim — destek, şifre sıfırlama, hesap yardımı */
export const ORBLY_SUPPORT_EMAIL = "info@orbly.social";

export const supportMailto = (subject?: string) => {
  const base = `mailto:${ORBLY_SUPPORT_EMAIL}`;
  if (!subject) return base;
  return `${base}?subject=${encodeURIComponent(subject)}`;
};
