import type { UserPublic } from "@orbly/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import { Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatCount } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} tarihinde katıldı`;
}

function formatWebsite(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function ProfileHeader({
  user,
  isSelf,
  isFollowing,
  followPending,
  onFollowToggle,
  onEditProfile,
  onBack,
  onSettings,
  onMessage,
  canMessage,
  messagePending,
}: {
  user: UserPublic;
  isSelf: boolean;
  isFollowing: boolean;
  followPending?: boolean;
  onFollowToggle: () => void;
  onEditProfile?: () => void;
  onBack?: () => void;
  onSettings?: () => void;
  onMessage?: () => void;
  canMessage?: boolean;
  messagePending?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 640;
  const banner = resolveMediaUrl(user.bannerUrl);

  return (
    <View>
      <View style={styles.bannerWrap}>
        {banner ? (
          <Image source={{ uri: banner }} style={styles.banner} contentFit="cover" />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}
        <View style={[styles.bannerBar, { paddingTop: insets.top + 4 }]}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={12}>
              <FontAwesome name="arrow-left" size={20} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <View style={styles.bannerBarRight}>
            {onSettings ? (
              <Pressable onPress={onSettings} style={styles.iconBtn} hitSlop={12}>
                <FontAwesome name="cog" size={20} color="#fff" />
              </Pressable>
            ) : !isSelf ? (
              <Pressable style={styles.iconBtn} hitSlop={12}>
                <FontAwesome name="ellipsis-h" size={20} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.avatarRow,
            { marginTop: compact ? -40 : -64 },
          ]}
        >
          <UserAvatar
            name={user.displayName}
            uri={user.avatarUrl}
            size={compact ? "xl" : "profile"}
            border
          />
          <View style={styles.actionCol}>
            {isSelf ? (
              <Pressable style={styles.outlineBtn} onPress={onEditProfile}>
                <Text style={styles.outlineBtnText}>Profili düzenle</Text>
              </Pressable>
            ) : (
              <View style={styles.actionRow}>
                {onMessage ? (
                  <Pressable
                    style={[styles.msgBtn, !canMessage && styles.msgBtnDisabled]}
                    onPress={onMessage}
                    disabled={!canMessage || messagePending}
                    hitSlop={8}
                  >
                    <FontAwesome
                      name="envelope"
                      size={18}
                      color={canMessage ? OrblyColors.textPrimary : OrblyColors.textSecondary}
                    />
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  disabled={followPending}
                  onPress={onFollowToggle}
                >
                  <Text style={[styles.followText, isFollowing && styles.followingText]}>
                    {isFollowing ? "Takip ediliyor" : "Takip et"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          {user.verified ? (
            <FontAwesome name="check-circle" size={18} color={OrblyColors.accent} />
          ) : null}
        </View>
        <Text style={styles.handle}>@{user.username}</Text>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        <View style={styles.metaRow}>
          {user.location ? (
            <Text style={styles.meta}>
              <FontAwesome name="map-marker" size={14} color={OrblyColors.textSecondary} />{" "}
              {user.location}
            </Text>
          ) : null}
          {user.website ? (
            <Pressable
              onPress={() => void Linking.openURL(
                user.website!.startsWith("http") ? user.website! : `https://${user.website}`,
              )}
            >
              <Text style={[styles.meta, styles.link]}>
                <FontAwesome name="link" size={14} color={OrblyColors.textSecondary} />{" "}
                {formatWebsite(user.website)}
              </Text>
            </Pressable>
          ) : null}
          {user.createdAt ? (
            <Text style={styles.meta}>
              <FontAwesome name="calendar-o" size={14} color={OrblyColors.textSecondary} />{" "}
              {formatJoinDate(user.createdAt)}
            </Text>
          ) : null}
        </View>

        <View style={styles.stats}>
          <Text style={styles.stat}>
            <Text style={styles.statBold}>{formatCount(user.stats.followingCount)}</Text>{" "}
            <Text style={styles.statLabel}>Takip edilen</Text>
          </Text>
          <Text style={styles.stat}>
            <Text style={styles.statBold}>{formatCount(user.stats.followersCount)}</Text>{" "}
            <Text style={styles.statLabel}>Takipçi</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: { height: 150, backgroundColor: OrblyColors.bgSecondary },
  banner: { ...StyleSheet.absoluteFillObject },
  bannerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OrblyColors.bgTertiary,
  },
  bannerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  bannerBarRight: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 16, paddingBottom: 4, zIndex: 1 },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  actionCol: {
    flexShrink: 1,
    maxWidth: "58%",
    alignItems: "flex-end",
    zIndex: 2,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  msgBtnDisabled: { opacity: 0.45 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  outlineBtnText: {
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    fontSize: 15,
    flexShrink: 1,
  },
  followBtn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 106,
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  followText: { fontWeight: "700", color: "#000", fontSize: 15 },
  followingText: { color: OrblyColors.textPrimary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 20, fontWeight: "800", color: OrblyColors.textPrimary },
  handle: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  bio: {
    fontSize: 15,
    color: OrblyColors.textPrimary,
    marginTop: 12,
    lineHeight: 20,
  },
  metaRow: { marginTop: 12, gap: 4 },
  meta: { fontSize: 15, color: OrblyColors.textSecondary, lineHeight: 20 },
  link: { color: OrblyColors.accent },
  stats: { flexDirection: "row", gap: 20, marginTop: 12 },
  stat: { fontSize: 15 },
  statBold: { fontWeight: "700", color: OrblyColors.textPrimary },
  statLabel: { color: OrblyColors.textSecondary },
});
