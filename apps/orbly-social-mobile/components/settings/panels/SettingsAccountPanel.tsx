import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ForgotPasswordModal } from "@/components/settings/ForgotPasswordModal";
import { SettingsAutoSaveNote } from "@/components/settings/SettingsAutoSaveNote";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { ORBLY_SUPPORT_EMAIL, supportMailto } from "@/lib/app-contact";
import { useAuthStore } from "@/lib/auth-store";

export function SettingsAccountPanel({
  onEditProfile,
  onSignOut,
}: {
  onEditProfile: () => void;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (!user) return null;

  return (
    <ScrollView style={styles.flex}>
      <SettingsAutoSaveNote />
      <View style={styles.profileCard}>
        <UserAvatar name={user.displayName} uri={user.avatarUrl} size="lg" />
        <View style={styles.profileText}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.handle}>@{user.username}</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={onEditProfile}>
          <Text style={styles.editBtnText}>Düzenle</Text>
        </Pressable>
      </View>

      <SettingsRow title="Hesap bilgileri" sub="Ad, bio, konum, avatar" onPress={onEditProfile} />
      <SettingsRow
        title="Profil sayfası"
        sub="Herkese açık profilini gör"
        onPress={() => router.push(`/profile/${user.username}` as never)}
      />
      <SettingsRow
        title="Yer imleri"
        sub="Kaydettiğin gönderiler"
        onPress={() => router.push("/bookmarks" as never)}
      />
      <SettingsRow
        title="Şifreni değiştir"
        sub="E-posta ile sıfırlama bağlantısı"
        onPress={() => setForgotOpen(true)}
      />
      <SettingsRow
        title="Yardım ve destek"
        sub={ORBLY_SUPPORT_EMAIL}
        onPress={() => void Linking.openURL(supportMailto("Destek"))}
      />

      <Pressable style={[styles.row, styles.danger]} onPress={onSignOut}>
        <Text style={styles.dangerText}>Çıkış yap</Text>
      </Pressable>

      <ForgotPasswordModal visible={forgotOpen} onClose={() => setForgotOpen(false)} />
    </ScrollView>
  );
}

function SettingsRow({
  title,
  sub,
  onPress,
}: {
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  profileText: { flex: 1 },
  name: { fontSize: 17, fontWeight: "800", color: OrblyColors.textPrimary },
  handle: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  editBtn: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: { fontWeight: "700", fontSize: 14, color: OrblyColors.textPrimary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  rowSub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
  danger: { marginTop: 16, justifyContent: "center" },
  dangerText: { fontSize: 17, fontWeight: "600", color: OrblyColors.like },
});
