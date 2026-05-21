import type { OrbitPublic } from "@orbly/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { OrblyColors } from "@/constants/Colors";

export function ProfileOrbitPills({ orbits }: { orbits: OrbitPublic[] }) {
  const router = useRouter();
  if (!orbits.length) return null;

  return (
    <View style={styles.row}>
      {orbits.map((orbit) => (
        <Pressable
          key={orbit.id}
          style={styles.pill}
          onPress={() => router.push(`/orbits/${orbit.slug}`)}
        >
          <Text style={styles.pillText}>
            {orbit.name.charAt(0).toUpperCase()} {orbit.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(120, 86, 255, 0.12)",
  },
  pillText: { fontSize: 13, fontWeight: "600", color: OrblyColors.orbit },
});
