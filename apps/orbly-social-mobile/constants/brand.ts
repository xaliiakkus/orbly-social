import type { ImageSourcePropType } from "react-native";

/** Üretilmiş ikonlar: `pnpm run generate:icons` */
export const BRAND_ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512] as const;

export type BrandLogoSize = "sm" | "md" | "lg" | "xl" | "header";

const LOGO_PX: Record<BrandLogoSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 128,
  header: 28,
};

const SOURCES: Record<number, ImageSourcePropType> = {
  32: require("@/assets/icons/icon-32.png"),
  48: require("@/assets/icons/icon-48.png"),
  64: require("@/assets/icons/icon-64.png"),
  96: require("@/assets/icons/icon-96.png"),
  128: require("@/assets/icons/icon-128.png"),
  180: require("@/assets/icons/icon-180.png"),
  192: require("@/assets/icons/icon-192.png"),
  256: require("@/assets/icons/icon-256.png"),
  512: require("@/assets/icons/icon-512.png"),
};

export function brandLogoSource(size: BrandLogoSize = "md") {
  const px = LOGO_PX[size];
  const key = px === 28 ? 32 : px;
  return SOURCES[key];
}

export function brandLogoDimensions(size: BrandLogoSize = "md") {
  return LOGO_PX[size];
}
