import { Redirect } from "expo-router";

import { useAuthStore } from "@/lib/auth-store";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated()) return <Redirect href="/login" />;
  if (user && !user.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
