import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { useThemeStore } from "@/lib/theme-store";

const TOKEN = /([#@][\w_]+)/g;

export function PostContent({ content }: { content: string }) {
  useThemeStore((s) => s.themeEpoch);
  const router = useRouter();
  const parts = content.split(TOKEN);

  return (
    <Text style={styles.content}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
          const tag = part.slice(1);
          return (
            <Text
              key={`${i}-${part}`}
              style={styles.link}
              onPress={() => router.push(`/hashtag/${encodeURIComponent(tag)}`)}
            >
              {part}
            </Text>
          );
        }
        if (part.startsWith("@") && part.length > 1) {
          const username = part.slice(1);
          return (
            <Text
              key={`${i}-${part}`}
              style={styles.link}
              onPress={() => router.push(`/profile/${username}`)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={`${i}-${part}`}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    color: OrblyColors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  link: { color: OrblyColors.accent },
});
