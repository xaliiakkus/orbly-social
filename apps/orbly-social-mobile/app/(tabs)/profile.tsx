import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";

/** Gizli sekme — kendi profiline yönlendirir (web menü davranışı). */
export default function ProfileTabRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    }
  }, [user?.username, router]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={OrblyColors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: OrblyColors.bgPrimary },
});
