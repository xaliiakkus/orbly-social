import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Status bar altında ek boşluk (X — başlık/ikonlar biraz aşağıda) */
export const HEADER_BELOW_STATUS_PADDING = 11;

/** Üst bar içerik yüksekliği (status bar padding hariç) */
export const HEADER_CONTENT_MIN_HEIGHT = 56;

/** İkon satırı yüksekliği (home indicator hariç) */
export const TAB_BAR_CONTENT_HEIGHT = 54;

/** @deprecated useTabBarMetrics().totalHeight */
export const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT;

/** Tab bar + sistem alt çubuğu (home indicator / gesture nav) */
/** Üst header / stack bar — status bar + alt padding */
export function useHeaderMetrics() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? 12 : 0);
  const paddingTop = topInset + HEADER_BELOW_STATUS_PADDING;
  return {
    topInset,
    paddingTop,
    contentMinHeight: HEADER_CONTENT_MIN_HEIGHT,
    totalMinHeight: paddingTop + HEADER_CONTENT_MIN_HEIGHT,
  };
}

export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 12 : 0,
  );
  return {
    bottomInset,
    contentHeight: TAB_BAR_CONTENT_HEIGHT,
    totalHeight: TAB_BAR_CONTENT_HEIGHT + bottomInset,
  };
}

export const FEED_AVATAR_SIZE = 40;
export const POST_ACTION_MAX_WIDTH = 425;
