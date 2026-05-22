import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { useHeaderMetrics } from "@/constants/layout";

type Props = {
  unreadTotal: number;
  filter: string;
  onFilterChange: (value: string) => void;
  showNewChat: boolean;
  onToggleNewChat: () => void;
  newUserId: string;
  onNewUserIdChange: (value: string) => void;
  onStartChat: () => void;
  startPending?: boolean;
};

/** Mesajlar sekmesi — status bar altında kalır (TabPageHeader / NotificationsHeader ile aynı) */
export function MessagesInboxHeader({
  unreadTotal,
  filter,
  onFilterChange,
  showNewChat,
  onToggleNewChat,
  newUserId,
  onNewUserIdChange,
  onStartChat,
  startPending,
}: Props) {
  const header = useHeaderMetrics();

  return (
    <View
      style={[
        styles.hero,
        { paddingTop: header.paddingTop, paddingBottom: 12 },
      ]}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroText}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>
            {unreadTotal > 0
              ? `${unreadTotal} okunmamış`
              : "Özel sohbetlerin"}
          </Text>
        </View>
        <Pressable
          style={[styles.newBtn, showNewChat && styles.newBtnActive]}
          onPress={onToggleNewChat}
        >
          <FontAwesome
            name="pencil"
            size={16}
            color={showNewChat ? OrblyColors.textPrimary : "#fff"}
          />
          <Text
            style={[styles.newBtnText, showNewChat && styles.newBtnTextActive]}
          >
            Yeni
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <FontAwesome
          name="search"
          size={15}
          color={OrblyColors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.search}
          value={filter}
          onChangeText={onFilterChange}
          placeholder="Kişi veya mesaj ara…"
          placeholderTextColor={OrblyColors.textSecondary}
        />
      </View>

      {showNewChat ? (
        <View style={styles.newChatCard}>
          <Text style={styles.newChatLabel}>Kullanıcı adı ile sohbet başlat</Text>
          <View style={styles.newChatRow}>
            <TextInput
              style={styles.newChatInput}
              value={newUserId}
              onChangeText={onNewUserIdChange}
              placeholder="@kullaniciadi"
              placeholderTextColor={OrblyColors.textSecondary}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.newChatBtn}
              onPress={onStartChat}
              disabled={startPending}
            >
              <Text style={styles.newChatBtnText}>Başlat</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgSecondary,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroText: { flex: 1 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: OrblyColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: OrblyColors.textSecondary,
    marginTop: 4,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  newBtnActive: {
    backgroundColor: OrblyColors.bgPrimary,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  newBtnTextActive: { color: OrblyColors.textPrimary },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: OrblyColors.bgPrimary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  search: {
    flex: 1,
    paddingVertical: 11,
    color: OrblyColors.textPrimary,
    fontSize: 15,
  },
  newChatCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: OrblyColors.bgPrimary,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  newChatLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: OrblyColors.textSecondary,
    marginBottom: 8,
  },
  newChatRow: { flexDirection: "row", gap: 8 },
  newChatInput: {
    flex: 1,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: OrblyColors.textPrimary,
    fontSize: 15,
  },
  newChatBtn: {
    backgroundColor: OrblyColors.accent,
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  newChatBtnText: { color: "#fff", fontWeight: "700" },
});
