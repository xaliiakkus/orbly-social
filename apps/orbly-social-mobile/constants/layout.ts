import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** İkon satırı yüksekliği (home indicator hariç) */
export const TAB_BAR_CONTENT_HEIGHT = 53;

/** @deprecated useTabBarMetrics().totalHeight */
export const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT;

/** Tab bar + sistem alt çubuğu (home indicator / gesture nav) */
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
