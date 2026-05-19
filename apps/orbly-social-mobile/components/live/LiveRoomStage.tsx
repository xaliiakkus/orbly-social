import { isTrackReference, useTracks } from "@livekit/components-react";
import { VideoTrack } from "@livekit/react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Track } from "livekit-client";
import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function LiveRoomStage({
  isHost,
  isSpace,
  videoMode,
  channelTitle,
  listenerCount,
  speakerCount,
}: {
  isHost: boolean;
  isSpace?: boolean;
  videoMode: boolean;
  channelTitle: string;
  listenerCount: number;
  speakerCount?: number;
}) {
  const trackOpts = { onlySubscribed: !isHost };

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    trackOpts,
  );
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    trackOpts,
  );

  const screen = screenTracks.find(isTrackReference);
  const camera = cameraTracks.find(isTrackReference);
  const hasVideo = Boolean(screen || camera);

  return (
    <View style={styles.wrap}>
      <View style={styles.badges}>
        <View style={[styles.liveBadge, isSpace && styles.spaceBadge]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>{isSpace ? "SOHBET" : "CANLI"}</Text>
        </View>
        {isHost && <Text style={styles.hostBadge}>Yayıncı</Text>}
        <Text style={styles.countBadge}>
          {isSpace
            ? `${listenerCount} dinleyici · ${speakerCount ?? 1} konuşmacı`
            : `${listenerCount} izleyici`}
        </Text>
      </View>

      <View style={[styles.stage, !hasVideo && styles.stageEmpty]}>
        {screen ? (
          <View style={styles.fullVideo}>
            <VideoTrack trackRef={screen} style={styles.video} objectFit="contain" />
            {camera && (
              <View style={styles.pip}>
                <VideoTrack trackRef={camera} style={styles.video} objectFit="cover" />
              </View>
            )}
          </View>
        ) : camera ? (
          <VideoTrack trackRef={camera} style={styles.video} objectFit="contain" />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconCircle}>
              <FontAwesome
                name={videoMode ? "video-camera" : "microphone"}
                size={36}
                color={videoMode ? OrblyColors.textSecondary : OrblyColors.like}
              />
            </View>
            <Text style={styles.placeholderTitle}>
              {videoMode
                ? isHost
                  ? "Kamera veya ekranını aç"
                  : "Yayın başlamak üzere…"
                : channelTitle}
            </Text>
            <Text style={styles.placeholderSub}>
              {videoMode
                ? isHost
                  ? "Alttaki kontrollerden mikrofon veya kamerayı başlat."
                  : "Yayıncı ses veya görüntü gönderdiğinde burada görünür."
                : isSpace
                  ? isHost
                    ? "Odayı yönetiyorsun."
                    : "Sesli sohbet — konuşmacılar duyulur."
                  : isHost
                    ? "Mikrofonu aç ve konuş."
                    : "Sesli yayın bekleniyor…"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle} numberOfLines={1}>
          {channelTitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000", minHeight: 220 },
  badges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: OrblyColors.like,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  spaceBadge: { backgroundColor: OrblyColors.accent },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  liveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  hostBadge: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countBadge: {
    marginLeft: "auto",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stage: { flex: 1, justifyContent: "center", alignItems: "center" },
  stageEmpty: { backgroundColor: "#111" },
  fullVideo: { flex: 1, width: "100%" },
  video: { width: "100%", height: "100%" },
  pip: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 120,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  placeholder: { alignItems: "center", padding: 24, gap: 12 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: { color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center" },
  placeholderSub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: OrblyColors.bgPrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
  },
  footerTitle: { fontWeight: "700", color: OrblyColors.textPrimary, fontSize: 15 },
});
