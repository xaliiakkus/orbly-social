/** Üretilmiş ikonlar: `pnpm --filter mobile generate:icons` */
export const BRAND_ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512] as const;

export type BrandIconSize = (typeof BRAND_ICON_SIZES)[number];

export function brandIconUrl(size: BrandIconSize) {
  return `/icons/icon-${size}.png`;
}

/** UI logosu (header, auth) */
export const BRAND_LOGO_SRC = brandIconUrl(128);

export const BRAND_APPLE_ICON = brandIconUrl(180);
