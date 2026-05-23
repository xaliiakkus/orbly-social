import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { DynamicNavTheme } from "@/components/DynamicNavTheme";
import { Providers } from "@/components/Providers";
import { OrblyColors } from "@/constants/Colors";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/lib/auth-store";
import { hideSplashOnce, preventSplashAutoHide } from "@/lib/splash";

export { ErrorBoundary } from "expo-router";

preventSplashAutoHide();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded || error) hideSplashOnce();
  }, [loaded, error]);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: OrblyColors.bgPrimary }} />;
  }

  return (
    <Providers>
      <DynamicNavTheme>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="signup" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="privacy" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="kvkk" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="messages/[id]" options={{ title: "Sohbet" }} />
          <Stack.Screen name="post/[id]" options={{ title: "Gönderi" }} />
          <Stack.Screen name="bookmarks" options={{ title: "Yer İmleri" }} />
          <Stack.Screen name="live/[id]" options={{ title: "Canlı" }} />
          <Stack.Screen name="live/[id]/ozet" options={{ title: "Yayın özeti" }} />
          <Stack.Screen name="hashtag/[tag]" options={{ title: "Etiket" }} />
          <Stack.Screen name="orbits" options={{ title: "Orbit'ler" }} />
          <Stack.Screen name="orbits/[slug]" options={{ title: "Orbit" }} />
          <Stack.Screen name="settings" options={{ title: "Ayarlar" }} />
          <Stack.Screen name="profile/[username]" options={{ title: "Profil" }} />
        </Stack>
      </DynamicNavTheme>
    </Providers>
  );
}

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;

    void (async () => {
      const inAuth =
        segments[0] === "login" ||
        segments[0] === "signup" ||
        segments[0] === "privacy" ||
        segments[0] === "kvkk";
      const inOnboarding = segments[0] === "onboarding";
      const addingAccount =
        (await SecureStore.getItemAsync("orbly-add-account")) === "1";

      if (!isAuthenticated() && !inAuth) {
        router.replace("/login");
      } else if (isAuthenticated() && user && !user.onboarded && !inOnboarding) {
        router.replace("/onboarding");
      } else if (
        isAuthenticated() &&
        user?.onboarded &&
        (inAuth || inOnboarding) &&
        !addingAccount
      ) {
        router.replace("/(tabs)");
      }
    })();
  }, [hydrated, segments, isAuthenticated, user, router]);

  return null;
}
