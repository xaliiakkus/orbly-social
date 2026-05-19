import { Image as ExpoImageRoot, type ImageProps } from "expo-image";
import { createElement } from "react";

/**
 * expo-image sınıf bileşeni, React 19 JSX sıkı tiplemesiyle doğrudan uyumsuz.
 * createElement ile köprülenir; davranış expo-image ile aynıdır.
 */
export function Image(props: ImageProps) {
  return createElement(ExpoImageRoot as never, props);
}

export type { ImageProps } from "expo-image";
