import type { UserPublic } from "@orbly/types";
import { useQuery } from "@tanstack/react-query";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "@/components/ui/expo-image";
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileMutualFollowers } from "@/components/profile/ProfileMutualFollowers";
import { ProfileOrbitPills } from "@/components/profile/ProfileOrbitPills";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
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

const GRADIENT_BG = "#1d2a3a";

export function ProfileHeader({
  user,
  isSelf,
  isFollowing,
  isFollowedBy,
  followPending,
  onFollowToggle,
  onEditProfile,
  onBack,
  onSettings,
  onMessage,
  canMessage,
  messagePending,
  postsCount,
}: {
  user: UserPublic;
  isSelf: boolean;
  isFollowing: boolean;
  isFollowedBy?: boolean;
  followPending?: boolean;
  onFollowToggle: () => void;
  onEditProfile?: () => void;
  onBack?: () => void;
  onSettings?: () => void;
  onMessage?: () => void;
  canMessage?: boolean;
  messagePending?: boolean;
  postsCount?: number;
}) {
  const insets = useSafeAreaInsets();
  const banner = resolveMediaUrl(user.bannerUrl);

  const orbitsQuery = useQuery({
    queryKey: ["profile-orbits", user.username],
    queryFn: () => api.users.orbits(user.username),
    staleTime: 60_000,
  });

  const mutualQuery = useQuery({
    queryKey: ["profile-mutual-followers", user.username],
    queryFn: () => api.users.mutualFollowers(user.username, 3),
    enabled: !isSelf,
    staleTime: 60_000,
  });

  const shareProfile = async () => {
    const url = `https://orbly.social/profile/${user.username}`;
    try {
      await Share.share({ message: url, url });
    } catch {
      Alert.alert("Profil bağlantısı", url);
    }
  };

  return (
    <View>
      <View style={styles.bannerWrap}>
        {banner ? (
          <Image source={{ uri: banner }} style={styles.banner} contentFit="cover" />
        ) : (
          <View style={[styles.banner, styles.gradientBanner]}>
            <View style={styles.ringOuter} pointerEvents="none" />
            <View style={styles.ringInner} pointerEvents="none" />
          </View>
        )}
        {banner ? <View style={styles.bannerOverlay} pointerEvents="none" /> : null}

        <View style={[styles.bannerBar, { paddingTop: insets.top + 4 }]}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.bannerIconBtn} hitSlop={12}>
              <FontAwesome name="arrow-left" size={18} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.bannerIconBtn} />
          )}
          <View style={styles.bannerTitleWrap}>
            <Text style={styles.bannerName} numberOfLines={1}>
              {user.displayName}
            </Text>
            {postsCount !== undefined ? (
              <Text style={styles.bannerPosts}>{formatCount(postsCount)} gönderi</Text>
            ) : null}
          </View>
          <View style={styles.bannerBarRight}>
            {onSettings ? (
              <Pressable onPress={onSettings} style={styles.bannerIconBtn} hitSlop={12}>
                <FontAwesome name="cog" size={18} color="#fff" />
              </Pressable>
            ) : (
              <View style={styles.bannerIconBtn} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarAbsolute}>
          <View>
            <UserAvatar
              name={user.displayName}
              uri={user.avatarUrl}
              size="profile"
              border
            />
            <View style={styles.onlineDot} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.outlineIconBtn} onPress={() => void shareProfile()} hitSlop={8}>
            <FontAwesome name="share-alt" size={16} color={OrblyColors.textPrimary} />
          </Pressable>
          <Pressable style={styles.outlineIconBtn} hitSlop={8}>
            <FontAwesome name="ellipsis-h" size={16} color={OrblyColors.textPrimary} />
          </Pressable>
          {!isSelf && onMessage ? (
            <Pressable
              style={[styles.outlineIconBtn, !canMessage && styles.disabledBtn]}
              onPress={onMessage}
              disabled={!canMessage || messagePending}
              hitSlop={8}
            >
              <FontAwesome
                name="envelope-o"
                size={16}
                color={canMessage ? OrblyColors.textPrimary : OrblyColors.textSecondary}
              />
            </Pressable>
          ) : null}
          {isSelf ? (
            <Pressable style={styles.outlineBtn} onPress={onEditProfile}>
              <Text style={styles.outlineBtnText}>Profili düzenle</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              disabled={followPending}
              onPress={onFollowToggle}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? "Takip ediliyor" : "Takip et"}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            {user.verified ? (
              <FontAwesome name="check-circle" size={20} color={OrblyColors.accent} />
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
                onPress={() =>
                  void Linking.openURL(
                    user.website!.startsWith("http") ? user.website! : `https://${user.website}`,
                  )
                }
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

          {isFollowedBy && !isSelf ? (
            <Text style={styles.followsYou}>
              <Text style={styles.followsYouBold}>@{user.username}</Text> seni takip ediyor
            </Text>
          ) : null}

          {!isSelf && mutualQuery.data && mutualQuery.data.totalCount > 0 ? (
            <ProfileMutualFollowers
              users={mutualQuery.data.data}
              totalCount={mutualQuery.data.totalCount}
            />
          ) : null}

          <ProfileOrbitPills orbits={orbitsQuery.data?.data ?? []} />
        </View>
      </View>
    </View>
  );
}

const AVATAR_OVERLAP = 67;

const styles = StyleSheet.create({
  bannerWrap: { height: 192, backgroundColor: GRADIENT_BG, overflow: "hidden" },
  banner: { ...StyleSheet.absoluteFillObject },
  gradientBanner: { backgroundColor: GRADIENT_BG },
  ringOuter: {
    position: "absolute",
    top: "50%",
    left: "33%",
    width: 256,
    height: 256,
    marginTop: -128,
    marginLeft: -128,
    borderRadius: 128,
    borderWidth: 1,
    borderColor: "rgba(29, 155, 240, 0.4)",
    opacity: 0.3,
  },
  ringInner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 160,
    height: 160,
    marginTop: -80,
    marginLeft: -80,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(120, 86, 255, 0.4)",
    opacity: 0.3,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  bannerTitleWrap: { flex: 1, minWidth: 0, alignItems: "center" },
  bannerName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerPosts: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  bannerBarRight: { width: 36 },
  bannerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 16, paddingBottom: 4, position: "relative" },
  avatarAbsolute: {
    position: "absolute",
    top: -AVATAR_OVERLAP,
    left: 16,
    zIndex: 2,
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: OrblyColors.repost,
    borderWidth: 2,
    borderColor: OrblyColors.bgPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 16,
    minHeight: 52,
    marginBottom: 4,
  },
  outlineIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: { opacity: 0.45 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  outlineBtnText: {
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    fontSize: 15,
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
  infoBlock: { marginTop: AVATAR_OVERLAP + 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 23, fontWeight: "800", color: OrblyColors.textPrimary },
  handle: { fontSize: 15, color: OrblyColors.textSecondary, marginTop: 2 },
  bio: {
    fontSize: 15,
    color: OrblyColors.textPrimary,
    marginTop: 12,
    lineHeight: 20,
  },
  metaRow: { marginTop: 12, gap: 4 },
  meta: { fontSize: 14, color: OrblyColors.textSecondary, lineHeight: 20 },
  link: { color: OrblyColors.accent },
  stats: { flexDirection: "row", gap: 20, marginTop: 12 },
  stat: { fontSize: 15 },
  statBold: { fontWeight: "700", color: OrblyColors.textPrimary },
  statLabel: { color: OrblyColors.textSecondary },
  followsYou: { fontSize: 13, color: OrblyColors.textSecondary, marginTop: 8 },
  followsYouBold: { color: OrblyColors.textPrimary, fontWeight: "600" },
});
