import { Image } from "@/components/ui/expo-image";
import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { resolveMediaUrl } from "@/lib/media-url";

const SIZES = { sm: 32, md: 40, lg: 52, xl: 84, profile: 134 } as const;

export function UserAvatar({
  name,
  uri,
  size = "md",
  border,
}: {
  name: string;
  uri?: string | null;
  size?: keyof typeof SIZES;
  border?: boolean;
}) {
  const px = SIZES[size];
  const src = resolveMediaUrl(uri);
  return (
    <View
      style={[
        styles.base,
        { width: px, height: px, borderRadius: px / 2 },
        border && styles.border,
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: px, height: px, borderRadius: px / 2 }} />
      ) : (
        <Text style={[styles.letter, { fontSize: px * 0.38 }]}>{name.charAt(0)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  border: {
    borderWidth: 4,
    borderColor: OrblyColors.bgPrimary,
  },
  letter: { fontWeight: "800", color: OrblyColors.textPrimary },
});
