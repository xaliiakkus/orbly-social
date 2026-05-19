import { useLocalParticipant } from "@livekit/components-react";
import { ScreenCapturePickerView } from "@livekit/react-native-webrtc";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Track, type LocalParticipant } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  findNodeHandle,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";

type ScreenCapturePickerManager = {
  show?: (reactTag: number) => Promise<void>;
};

function useScreenSharePublished(localParticipant: LocalParticipant) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => {
      const p = localParticipant.getTrackPublication(Track.Source.ScreenShare);
      setOn(Boolean(p?.track && !p.isMuted));
    };
    sync();
    localParticipant.on("trackPublished", sync);
    localParticipant.on("trackUnpublished", sync);
    localParticipant.on("trackMuted", sync);
    localParticipant.on("trackUnmuted", sync);
    return () => {
      localParticipant.off("trackPublished", sync);
      localParticipant.off("trackUnpublished", sync);
      localParticipant.off("trackMuted", sync);
      localParticipant.off("trackUnmuted", sync);
    };
  }, [localParticipant]);
  return on;
}

export function LiveRoomControls({
  videoMode,
  isHost,
  onLeave,
}: {
  videoMode: boolean;
  /** Ekran paylaşımı yalnızca görüntülü yayında host için (web ile aynı mantık). */
  isHost: boolean;
  onLeave: () => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(videoMode);
  const [screenBusy, setScreenBusy] = useState(false);
  const screenPickerRef = useRef(null);

  const screenShareOn = useScreenSharePublished(localParticipant);

  useEffect(() => {
    void localParticipant.setMicrophoneEnabled(micOn);
  }, [localParticipant, micOn]);

  useEffect(() => {
    if (!videoMode) return;
    void localParticipant.setCameraEnabled(camOn);
  }, [localParticipant, camOn, videoMode]);

  const toggleScreenShare = useCallback(async () => {
    if (screenBusy) return;
    if (screenShareOn) {
      setScreenBusy(true);
      try {
        await localParticipant.setScreenShareEnabled(false);
      } catch (e) {
        Alert.alert("Ekran paylaşımı", e instanceof Error ? e.message : "Kapatılamadı");
      } finally {
        setScreenBusy(false);
      }
      return;
    }

    setScreenBusy(true);
    try {
      if (Platform.OS === "ios") {
        const mgr = NativeModules.ScreenCapturePickerViewManager as ScreenCapturePickerManager | undefined;
        const tag = findNodeHandle(screenPickerRef.current);
        if (mgr?.show && tag != null) {
          await mgr.show(tag);
        }
      }
      await localParticipant.setScreenShareEnabled(true);
    } catch (e) {
      Alert.alert(
        "Ekran paylaşımı",
        e instanceof Error
          ? e.message
          : "Başlatılamadı. iOS’ta Broadcast Extension kurulumu gerekebilir; Android’de yeniden dene.",
      );
    } finally {
      setScreenBusy(false);
    }
  }, [localParticipant, screenBusy, screenShareOn]);

  const explainTvMirroring = useCallback(() => {
    Alert.alert(
      "TV / sistem ekran yansıtması",
      Platform.OS === "ios"
        ? "Kontrol Merkezi → Ekran Yansıtma (veya AirPlay) ile telefonunun tüm ekranını TV’ye yansıtırsın; bu, izleyicilere gönderdiğin LiveKit yayınından bağımsızdır.\n\nYayına ekran göndermek için alttaki “ekran” düğmesini kullan; uygulama dışına çıkınca iOS güvenlik nedeniyle paylaşımı durdurabilir — TV yansıtmayı ayrı kullanabilirsin."
        : "Hızlı panelden Smart View / Cast / Ekran yansıtma ile TV’ye bağlan; bu sistem özelliği uygulama içi yayın ekranından farklıdır.\n\nYayına ekran göndermek için “ekran” düğmesi Android’in MediaProjection iznini açar; başka uygulamaya geçerken paylaşımın sürmesi için sistem izin penceresinde onaylı kal ve güç tasarrufunu kapat.",
    );
  }, []);

  return (
    <View style={styles.bar}>
      {Platform.OS === "ios" ? (
        <View style={styles.screenPickerWrap} pointerEvents="none">
          <ScreenCapturePickerView ref={screenPickerRef} />
        </View>
      ) : null}

      <Pressable style={styles.btn} onPress={() => setMicOn((v) => !v)}>
        <FontAwesome
          name={micOn ? "microphone" : "microphone-slash"}
          size={20}
          color={micOn ? OrblyColors.textPrimary : OrblyColors.like}
        />
      </Pressable>
      {videoMode && (
        <Pressable style={styles.btn} onPress={() => setCamOn((v) => !v)}>
          <FontAwesome
            name="video-camera"
            size={20}
            color={camOn ? OrblyColors.textPrimary : OrblyColors.like}
          />
        </Pressable>
      )}
      {videoMode && isHost && (
        <>
          <Pressable
            style={[styles.btn, screenShareOn && styles.btnActive]}
            disabled={screenBusy}
            onPress={() => void toggleScreenShare()}
          >
            <FontAwesome
              name="desktop"
              size={20}
              color={screenShareOn ? OrblyColors.accent : OrblyColors.textPrimary}
            />
          </Pressable>
          <Pressable style={styles.btn} onPress={explainTvMirroring} accessibilityLabel="TV yansıtma bilgisi">
            <FontAwesome name="tv" size={18} color={OrblyColors.textSecondary} />
          </Pressable>
        </>
      )}
      <Pressable style={[styles.btn, styles.leaveBtn]} onPress={onLeave}>
        <Text style={styles.leaveText}>Ayrıl</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#0a0a0a",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    flexWrap: "wrap",
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: { borderWidth: 1, borderColor: OrblyColors.accent },
  leaveBtn: { width: "auto", paddingHorizontal: 20, marginLeft: 4 },
  leaveText: { color: OrblyColors.textPrimary, fontWeight: "700" },
  /** iOS ReplayKit seçici: dış View konumlandırır; ref native picker’da kalır. */
  screenPickerWrap: {
    position: "absolute",
    width: 2,
    height: 2,
    opacity: 0.02,
    overflow: "hidden",
  },
});
