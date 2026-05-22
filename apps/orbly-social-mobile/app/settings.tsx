import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EditProfileModal } from "@/components/EditProfileModal";
import { SettingsAccountPanel } from "@/components/settings/panels/SettingsAccountPanel";
import { SettingsAppearancePanel } from "@/components/settings/panels/SettingsAppearancePanel";
import { SettingsLanguagePanel } from "@/components/settings/panels/SettingsLanguagePanel";
import { SettingsNotificationsPanel } from "@/components/settings/panels/SettingsNotificationsPanel";
import { SettingsPrivacyPanel } from "@/components/settings/panels/SettingsPrivacyPanel";
import { SettingsSecurityPanel } from "@/components/settings/panels/SettingsSecurityPanel";
import { OrblyColors } from "@/constants/Colors";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/auth-store";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import {
  SECTION_META,
  SETTINGS_NAV,
  type SettingsSectionId,
} from "@/lib/settings-config";

function SectionPanel({
  section,
  onEditProfile,
  onSignOut,
}: {
  section: SettingsSectionId;
  onEditProfile: () => void;
  onSignOut: () => void;
}) {
  const router = useRouter();

  switch (section) {
    case "account":
      return <SettingsAccountPanel onEditProfile={onEditProfile} onSignOut={onSignOut} />;
    case "appearance":
      return <SettingsAppearancePanel />;
    case "privacy":
      return <SettingsPrivacyPanel />;
    case "notifications":
      return <SettingsNotificationsPanel />;
    case "security":
      return <SettingsSecurityPanel />;
    case "language":
      return <SettingsLanguagePanel />;
    case "accessibility":
      return (
        <ScrollView>
          <Pressable
            style={styles.row}
            onPress={() => router.setParams({ section: "appearance" })}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Görünüm ve renk</Text>
              <Text style={styles.rowSub}>Tema ve vurgu rengi ayarları</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
          </Pressable>
        </ScrollView>
      );
    case "orbits":
      return (
        <ScrollView>
          <Pressable style={styles.row} onPress={() => router.push("/orbits" as never)}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Orbit'leri keşfet</Text>
              <Text style={styles.rowSub}>Topluluklara katıl veya ayrıl</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
          </Pressable>
        </ScrollView>
      );
    default:
      return (
        <Text style={styles.emptySection}>Bu bölüm yakında kullanıma sunulacak.</Text>
      );
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const removeAccount = useDeviceAccountsStore((s) => s.removeAccount);
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
            if (section) {
              setSection(null);
              router.setParams({ section: "" });
            } else router.back();
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
              style={[styles.row, item.available === false && styles.rowDisabled]}
              onPress={() => {
                setSection(item.id);
                router.setParams({ section: item.id });
              }}
            >
              <Text style={[styles.rowTitle, item.available === false && styles.muted]}>
                {item.label}
              </Text>
              {item.available !== false ? (
                <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
              ) : (
                <Text style={styles.soon}>Yakında</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.detail}>
          {meta?.description ? (
            <Text style={styles.sectionDesc}>{meta.description}</Text>
          ) : null}
          <SectionPanel
            section={section}
            onEditProfile={() => setEditOpen(true)}
            onSignOut={signOut}
          />
        </View>
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
  detail: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowDisabled: { opacity: 0.55 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  rowSub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
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
  emptySection: { color: OrblyColors.textSecondary, padding: 24, textAlign: "center" },
});
