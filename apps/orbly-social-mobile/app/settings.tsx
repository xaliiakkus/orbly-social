import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useReadAllNotifications } from "@orbly/features";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EditProfileModal } from "@/components/EditProfileModal";
import { OrblyColors } from "@/constants/Colors";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/auth-store";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import {
  SECTION_META,
  SETTINGS_NAV,
  type SettingsSectionId,
} from "@/lib/settings-config";

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const removeAccount = useDeviceAccountsStore((s) => s.removeAccount);
  const readAllNotifications = useReadAllNotifications();
  const [section, setSection] = useState<SettingsSectionId | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const s = params.section;
    if (s && s in SECTION_META) setSection(s as SettingsSectionId);
  }, [params.section]);

  const signOut = () => {
    if (user) removeAccount(user.id);
    logout();
    disconnectSocket();
    router.replace("/login");
  };

  const meta = section ? SECTION_META[section] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => {
            if (section) setSection(null);
            else router.back();
          }}
        >
          <FontAwesome name="arrow-left" size={22} color={OrblyColors.textPrimary} />
        </Pressable>
        <Text style={styles.barTitle}>
          {section ? meta?.title : "Ayarlar ve gizlilik"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {!section ? (
        <ScrollView>
          {SETTINGS_NAV.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.row, !item.available && styles.rowDisabled]}
              disabled={!item.available}
              onPress={() => setSection(item.id)}
            >
              <Text style={[styles.rowText, !item.available && styles.muted]}>
                {item.label}
              </Text>
              {item.available ? (
                <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
              ) : (
                <Text style={styles.soon}>Yakında</Text>
              )}
            </Pressable>
          ))}
          <Pressable style={[styles.row, styles.danger]} onPress={signOut}>
            <Text style={[styles.rowText, styles.dangerText]}>Çıkış yap</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView>
          {meta?.description ? (
            <Text style={styles.sectionDesc}>{meta.description}</Text>
          ) : null}
          {meta?.items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.detailRow, !item.available && styles.rowDisabled]}
              disabled={!item.available}
              onPress={() => {
                if (item.action === "edit-profile") setEditOpen(true);
                else if (item.action === "mark-notifications-read") readAllNotifications.mutate();
                else if (item.href) router.push(item.href as never);
              }}
            >
              <View style={styles.detailText}>
                <Text style={styles.detailTitle}>{item.title}</Text>
                <Text style={styles.detailSub}>{item.description}</Text>
              </View>
              {item.available ? (
                <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
              ) : (
                <Text style={styles.soon}>Yakında</Text>
              )}
            </Pressable>
          ))}
          {!meta?.items.length && (
            <Text style={styles.emptySection}>Bu bölüm yakında.</Text>
          )}
        </ScrollView>
      )}

      {user && (
        <EditProfileModal
          user={user}
          visible={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  barTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: OrblyColors.textPrimary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowDisabled: { opacity: 0.55 },
  rowText: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  muted: { color: OrblyColors.textSecondary },
  soon: { fontSize: 13, color: OrblyColors.textSecondary },
  sectionDesc: {
    padding: 16,
    color: OrblyColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  detailText: { flex: 1 },
  detailTitle: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  detailSub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
  emptySection: { color: OrblyColors.textSecondary, padding: 24, textAlign: "center" },
  danger: { marginTop: 24 },
  dangerText: { color: OrblyColors.like },
});
