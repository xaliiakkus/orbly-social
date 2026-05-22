import { formatUserError } from "@orbly/api-client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { AutoSaveStatus, type AutoSaveState } from "@/components/settings/AutoSaveStatus";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function SettingsPrivacyPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saveState, setSaveState] = useState<AutoSaveState>("idle");
  const [error, setError] = useState("");

  if (!user) return null;

  const togglePrivate = async (isPrivate: boolean) => {
    const prev = user.isPrivate;
    setUser({ ...user, isPrivate });
    setSaveState("saving");
    setError("");
    try {
      const { user: updated } = await api.users.updateMe({ isPrivate });
      setUser(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (e) {
      setUser({ ...user, isPrivate: prev });
      setError(formatUserError(e));
      setSaveState("error");
    }
  };

  return (
    <ScrollView style={styles.flex}>
      <View style={styles.statusRow}>
        <Text style={styles.autoNote}>Değişiklikler otomatik kaydedilir.</Text>
        <AutoSaveStatus state={saveState} error={error || undefined} />
      </View>
      <SettingsToggle
        label="Gizli hesap"
        description="Onaylamadığın kişiler gönderilerini göremez"
        checked={user.isPrivate}
        onChange={(v) => void togglePrivate(v)}
      />
      <Pressable
        style={styles.linkRow}
        onPress={() => router.push(`/profile/${user.username}` as never)}
      >
        <View style={styles.linkText}>
          <Text style={styles.linkTitle}>Profilini görüntüle</Text>
          <Text style={styles.linkSub}>Başkalarının gördüğü profil</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  autoNote: { fontSize: 13, color: OrblyColors.textSecondary, flex: 1 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  linkText: { flex: 1 },
  linkTitle: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  linkSub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
});
