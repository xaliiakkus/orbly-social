import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountSwitcher } from "@/components/AccountSwitcher";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/auth-store";
import { formatCount } from "@/lib/format";

const DRAWER_W = Math.min(Dimensions.get("window").width * 0.88, 340);

const NAV = [
  { href: "/(tabs)/" as const, label: "Ana Sayfa", icon: "home" as const },
  { href: "/(tabs)/explore" as const, label: "Keşfet", icon: "search" as const },
  { href: "/(tabs)/live" as const, label: "Canlı", icon: "microphone" as const },
  { href: "/orbits" as const, label: "Orbit'ler", icon: "star" as const },
  { href: "/bookmarks" as const, label: "Yer İmleri", icon: "bookmark-o" as const },
  { href: "/(tabs)/notifications" as const, label: "Bildirimler", icon: "bell-o" as const },
  { href: "/(tabs)/messages" as const, label: "Mesajlar", icon: "envelope-o" as const },
];

const NAV_SECONDARY = [
  { href: "/settings" as const, label: "Ayarlar ve gizlilik", icon: "cog" as const },
];

export function MenuDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const removeAccount = useDeviceAccountsStore((s) => s.removeAccount);
  const slide = useRef(new Animated.Value(-DRAWER_W)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : -DRAWER_W,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!user) return null;

  const go = (href: string) => {
    onClose();
    router.push(href as never);
  };

  const handleLogout = () => {
    removeAccount(user.id);
    logout();
    disconnectSocket();
    onClose();
    router.replace("/login");
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_W,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Pressable onPress={() => go(`/profile/${user.username}`)}>
              <UserAvatar name={user.displayName} uri={user.avatarUrl} size="lg" />
            </Pressable>
            <Pressable
              onPress={() => go("/login?addAccount=1")}
              style={styles.addAccountBtn}
              hitSlop={8}
            >
              <FontAwesome name="user-plus" size={20} color={OrblyColors.textPrimary} />
            </Pressable>
          </View>

          <Pressable style={styles.userBlock} onPress={() => go(`/profile/${user.username}`)}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <View style={styles.stats}>
              <Text style={styles.stat}>
                <Text style={styles.statBold}>{formatCount(user.stats.followingCount)}</Text>{" "}
                Takip edilen
              </Text>
              <Text style={styles.stat}>
                <Text style={styles.statBold}>{formatCount(user.stats.followersCount)}</Text>{" "}
                Takipçi
              </Text>
            </View>
          </Pressable>

          <AccountSwitcher onClose={onClose} />

          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            <Pressable style={styles.navRow} onPress={() => go(`/profile/${user.username}`)}>
              <FontAwesome name="user-o" size={24} color={OrblyColors.textPrimary} />
              <Text style={styles.navLabel}>Profil</Text>
            </Pressable>
            {NAV.map((item) => (
              <Pressable key={item.href} style={styles.navRow} onPress={() => go(item.href)}>
                <FontAwesome name={item.icon} size={24} color={OrblyColors.textPrimary} />
                <Text style={styles.navLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.divider} />
            {NAV_SECONDARY.map((item) => (
              <Pressable key={item.href} style={styles.navRow} onPress={() => go(item.href)}>
                <FontAwesome name={item.icon} size={24} color={OrblyColors.textPrimary} />
                <Text style={styles.navLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.navRow} onPress={handleLogout}>
              <FontAwesome name="sign-out" size={24} color={OrblyColors.textPrimary} />
              <Text style={styles.navLabel}>Çıkış yap</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.55)" },
  backdrop: { flex: 1 },
  drawer: {
    backgroundColor: OrblyColors.bgPrimary,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: OrblyColors.border,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  addAccountBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OrblyColors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  userBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  displayName: { fontSize: 20, fontWeight: "800", color: OrblyColors.textPrimary },
  username: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  stat: { fontSize: 15, color: OrblyColors.textSecondary },
  statBold: { fontWeight: "700", color: OrblyColors.textPrimary },
  navScroll: { flex: 1 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navLabel: { fontSize: 20, fontWeight: "700", color: OrblyColors.textPrimary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OrblyColors.border,
    marginVertical: 8,
    marginHorizontal: 20,
  },
});
