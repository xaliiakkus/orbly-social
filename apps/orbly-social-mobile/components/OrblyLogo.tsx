import { Image } from "@/components/ui/expo-image";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";

import {
  brandLogoDimensions,
  brandLogoSource,
  type BrandLogoSize,
} from "@/constants/brand";

type Props = {
  size?: BrandLogoSize;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Ana sayfaya git (feed sekmesi) */
  goHome?: boolean;
};

export function OrblyLogo({ size = "md", style, onPress, goHome = false }: Props) {
  const router = useRouter();
  const dim = brandLogoDimensions(size);
  const image = (
    <Image
      source={brandLogoSource(size)}
      style={{ width: dim, height: dim }}
      contentFit="contain"
      accessibilityLabel="Orbly"
    />
  );

  const handlePress = onPress ?? (goHome ? () => router.push("/(tabs)") : undefined);

  if (!handlePress) {
    return <View style={[styles.wrap, style]}>{image}</View>;
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.wrap, style]}
      accessibilityRole="button"
      accessibilityLabel="Orbly ana sayfa"
    >
      {image}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
