import { SOCKET_EVENTS, type FeedMode } from "@orbly/features";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ComposeFab } from "@/components/ComposeFab";
import { OrblyLogo } from "@/components/OrblyLogo";
import { ComposePrompt } from "@/components/ComposePrompt";
import { FeedList } from "@/components/FeedList";
import { MenuDrawer } from "@/components/MenuDrawer";
import { SpacesBanner } from "@/components/SpacesBanner";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { XTabs } from "@/components/ui/XTabs";
import { OrblyColors } from "@/constants/Colors";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/auth-store";

const FEED_TABS = [
  { id: "for-you" as const, label: "Sana özel" },
  { id: "following" as const, label: "Takip ediliyor" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<FeedMode>("for-you");
  const [feedBanner, setFeedBanner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const s = getSocket(token);
    const handler = () => setFeedBanner(true);
    s.on(SOCKET_EVENTS.feedNew, handler);
    return () => {
      s.off(SOCKET_EVENTS.feedNew, handler);
    };
  }, []);

  const dismissBanner = useCallback(() => setFeedBanner(false), []);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.sideSlot}>
          {user ? (
            <UserAvatar name={user.displayName} uri={user.avatarUrl} size="sm" />
          ) : null}
        </Pressable>
        <OrblyLogo size="header" goHome />
        <Pressable
          onPress={() => router.push("/orbits")}
          style={styles.sideSlot}
          hitSlop={8}
        >
          <Text style={styles.orbitGlyph}>✦</Text>
        </Pressable>
      </View>

      <XTabs tabs={FEED_TABS} active={tab} onChange={setTab} />
      <ComposePrompt onPress={() => setComposeOpen(true)} />

      <FeedList
        key={tab}
        mode={tab}
        feedBanner={feedBanner}
        onRefreshBanner={dismissBanner}
        ListHeaderComponent={<SpacesBanner />}
      />

      <ComposeFab open={composeOpen} onOpenChange={setComposeOpen} />
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  sideSlot: { width: 40, alignItems: "flex-start" },
  orbitGlyph: { fontSize: 22, color: OrblyColors.orbit, textAlign: "right", width: 40 },
});
