import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AccountLimitModal } from "@/components/AccountLimitModal";
import { OrblyColors } from "@/constants/Colors";
import { clearAddAccountFlow, stashReturnUserId } from "@/lib/add-account-flow";
import {
  MAX_DEVICE_ACCOUNTS,
  useDeviceAccountsStore,
} from "@/lib/device-accounts-store";
import { restoreSavedAccount } from "@/lib/restore-saved-account";
import { useAuthStore } from "@/lib/auth-store";

function Avatar({ uri, name }: { uri?: string | null; name: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function AccountSwitcher({
  onClose,
  hideAddAccount,
  loginMode,
}: {
  onClose?: () => void;
  hideAddAccount?: boolean;
  /** Giriş sayfası: kayıtlı hesaba (aktif dahil) tıklanınca oturuma geç */
  loginMode?: boolean;
}) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const accounts = useDeviceAccountsStore((s) => s.accounts);
  const canAddNewAccount = useDeviceAccountsStore((s) => s.canAddNewAccount);
  const [limitOpen, setLimitOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const activeId = currentUser?.id;

  const handleSwitch = async (userId: string) => {
    if (switching) return;
    const account = accounts.find((a) => a.userId === userId);
    if (!account) return;
    if (userId === activeId && !loginMode) return;

    setSwitching(userId);
    try {
      if (loginMode) {
        await clearAddAccountFlow();
      }

      if (loginMode && userId === activeId) {
        onClose?.();
        const user = useAuthStore.getState().user;
        router.replace(user?.onboarded ? "/(tabs)" : "/onboarding");
        return;
      }

      const ok = await restoreSavedAccount(account);
      if (!ok) return;

      onClose?.();
      const user = useAuthStore.getState().user;
      router.replace(user?.onboarded ? "/(tabs)" : "/onboarding");
    } finally {
      setSwitching(null);
    }
  };

  const handleAddAccount = async () => {
    if (!canAddNewAccount()) {
      setLimitOpen(true);
      return;
    }
    if (currentUser) {
      await stashReturnUserId(currentUser.id);
    }
    onClose?.();
    router.push("/login?addAccount=1");
  };

  const list =
    accounts.length > 0
      ? accounts
      : currentUser
        ? [
            {
              userId: currentUser.id,
              user: currentUser,
              accessToken: "",
              refreshToken: "",
              savedAt: "",
            },
          ]
        : [];

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.label}>
          Hesaplar ({list.length}/{MAX_DEVICE_ACCOUNTS})
        </Text>
        {list.map((acc) => {
          const active = acc.userId === activeId;
          return (
            <Pressable
              key={acc.userId}
              style={[styles.row, active && styles.rowActive]}
              disabled={!!switching}
              onPress={() => void handleSwitch(acc.userId)}
              accessibilityHint={
                loginMode && active ? "Bu hesapla devam et" : undefined
              }
            >
              <Avatar uri={acc.user.avatarUrl} name={acc.user.displayName} />
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>
                  {acc.user.displayName}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{acc.user.username}
                </Text>
              </View>
              {switching === acc.userId ? (
                <ActivityIndicator color={OrblyColors.accent} />
              ) : active && !loginMode ? (
                <FontAwesome name="check" size={18} color={OrblyColors.accent} />
              ) : null}
            </Pressable>
          );
        })}
        {!hideAddAccount && (
          <Pressable style={styles.addRow} onPress={() => void handleAddAccount()}>
            <View style={styles.addIcon}>
              <FontAwesome name="plus" size={14} color={OrblyColors.accent} />
            </View>
            <Text style={styles.addText}>Başka hesap ekle</Text>
          </Pressable>
        )}
      </View>
      <AccountLimitModal visible={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8 },
  label: {
    color: OrblyColors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  rowActive: { backgroundColor: OrblyColors.bgHover },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OrblyColors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 16 },
  meta: { flex: 1, minWidth: 0 },
  name: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 15 },
  handle: { color: OrblyColors.textSecondary, fontSize: 13 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10 },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: OrblyColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: OrblyColors.accent, fontWeight: "700", fontSize: 15 },
});
