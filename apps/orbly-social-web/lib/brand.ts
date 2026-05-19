/** Üretilmiş ikonlar: `yarn generate:icons` (apps/orbly-social-web) */
export const BRAND_ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512] as const;

export type BrandIconSize = (typeof BRAND_ICON_SIZES)[number];

/** Kaynak logo (public/icons/app_logo.png) — kare değil, UI'da bu oran korunur */
export const BRAND_LOGO_INTRINSIC_WIDTH = 683;
export const BRAND_LOGO_INTRINSIC_HEIGHT = 501;

export const BRAND_LOGO_ASPECT = BRAND_LOGO_INTRINSIC_WIDTH / BRAND_LOGO_INTRINSIC_HEIGHT;

export function brandIconUrl(size: BrandIconSize) {
  return `/icons/icon-${size}.png`;
}

/** Header, auth, sidebar — orijinal logo dosyası */
export const BRAND_LOGO_SRC = "/icons/app_logo.png";

export const BRAND_APPLE_ICON = brandIconUrl(180);

/** Görüntü yüksekliğine göre genişlik (oran bozulmaz) */
export function brandLogoDisplaySize(displayHeight: number) {
  return {
    width: Math.round(displayHeight * BRAND_LOGO_ASPECT),
    height: displayHeight,
  };
}
