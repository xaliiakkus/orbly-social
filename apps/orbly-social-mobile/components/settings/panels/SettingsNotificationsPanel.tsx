import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useReadAllNotifications } from "@orbly/features";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SettingsAutoSaveNote } from "@/components/settings/SettingsAutoSaveNote";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { OrblyColors } from "@/constants/Colors";
import {
  NOTIFICATION_PREF_LABELS,
  useNotificationPrefsStore,
  type NotificationPrefKey,
} from "@/lib/notification-prefs-store";

const KEYS = Object.keys(NOTIFICATION_PREF_LABELS) as NotificationPrefKey[];

export function SettingsNotificationsPanel() {
  const router = useRouter();
  const prefs = useNotificationPrefsStore();
  const readAll = useReadAllNotifications();

  return (
    <ScrollView style={styles.flex}>
      <SettingsAutoSaveNote />
      <Text style={styles.hint}>Hangi bildirim türlerini almak istediğini seç.</Text>
      {KEYS.map((key) => (
        <SettingsToggle
          key={key}
          label={NOTIFICATION_PREF_LABELS[key].title}
          description={NOTIFICATION_PREF_LABELS[key].description}
          checked={prefs[key]}
          onChange={(v) => prefs.setPref(key, v)}
        />
      ))}
      <Pressable style={styles.row} onPress={() => readAll.mutate()}>
        <View style={styles.rowText}>
          <Text style={styles.title}>Tümünü okundu işaretle</Text>
          <Text style={styles.sub}>Okunmamış bildirimleri temizle</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/(tabs)/notifications" as never)}
      >
        <View style={styles.rowText}>
          <Text style={styles.title}>Bildirim akışı</Text>
          <Text style={styles.sub}>Tüm bildirimleri görüntüle</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={OrblyColors.textSecondary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hint: {
    padding: 16,
    fontSize: 15,
    color: OrblyColors.textSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  rowText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "600", color: OrblyColors.textPrimary },
  sub: { fontSize: 14, color: OrblyColors.textSecondary, marginTop: 4 },
});
