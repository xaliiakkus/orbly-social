import { useLiveList } from "@orbly/features";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ComposeBox, type ComposeBoxHandle } from "@/components/ComposeBox";
import { GoLivePanel, type GoLivePanelHandle } from "@/components/live/GoLivePanel";
import { StartSpacePanel, type StartSpacePanelHandle } from "@/components/live/StartSpacePanel";
import { OrblyColors } from "@/constants/Colors";

export type ComposeModalMode = "compose" | "live" | "space";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPosted?: () => void;
  initialMode?: ComposeModalMode;
  liveAvailable?: boolean;
};

export function ComposeModal({
  visible,
  onClose,
  onPosted,
  initialMode = "compose",
  liveAvailable: liveAvailableProp,
}: Props) {
  const insets = useSafeAreaInsets();
  const { data: liveData } = useLiveList();
  const liveAvailable = liveAvailableProp ?? liveData?.configured !== false;

  const [mode, setMode] = useState<ComposeModalMode>(initialMode);
  const [actionEnabled, setActionEnabled] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [composeSession, setComposeSession] = useState(0);

  const composeRef = useRef<ComposeBoxHandle>(null);
  const liveRef = useRef<GoLivePanelHandle>(null);
  const spaceRef = useRef<StartSpacePanelHandle>(null);

  const isComposeMode = mode === "compose";
  const canBackToCompose = initialMode === "compose" && !isComposeMode;

  const onComposeState = useCallback((s: { canPost: boolean; isPending: boolean }) => {
    setActionEnabled(s.canPost);
    setActionPending(s.isPending);
  }, []);

  useEffect(() => {
    if (!visible) {
      setComposeSession((n) => n + 1);
      return;
    }
    setMode(initialMode);
    setActionPending(false);
    if (initialMode === "compose") {
      setActionEnabled(false);
    } else {
      setActionEnabled(liveAvailable);
    }
  }, [visible, initialMode, liveAvailable]);

  useEffect(() => {
    if (!visible || isComposeMode) return;
    setActionEnabled(liveAvailable);
    setActionPending(false);
  }, [mode, visible, liveAvailable, isComposeMode]);

  const handleLeft = () => {
    if (canBackToCompose) {
      setMode("compose");
      return;
    }
    onClose();
  };

  const handlePrimary = () => {
    if (isComposeMode) composeRef.current?.submit();
    else if (mode === "live") liveRef.current?.start();
    else spaceRef.current?.start();
  };

  const headerCenter = isComposeMode ? (
    <Text style={styles.drafts}>Taslaklar</Text>
  ) : mode === "live" ? (
    <Text style={styles.modeTitle}>Yayın aç</Text>
  ) : (
    <Text style={styles.modeTitle}>Oda aç</Text>
  );

  const primaryLabel = isComposeMode
    ? "Gönderi"
    : mode === "live"
      ? "Yayına başla"
      : "Odayı aç";

  const primaryDisabled = !actionEnabled || actionPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleLeft}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleLeft} hitSlop={12} style={styles.headerSide}>
            <Text style={styles.cancel}>{canBackToCompose ? "Geri" : "İptal et"}</Text>
          </Pressable>
          <View style={styles.headerCenter}>{headerCenter}</View>
          <Pressable
            onPress={handlePrimary}
            disabled={primaryDisabled}
            style={[styles.postBtn, primaryDisabled && styles.postBtnDisabled]}
          >
            {actionPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postBtnText}>{primaryLabel}</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.panel, !isComposeMode && styles.panelHidden]}>
          <ComposeBox
            key={composeSession}
            ref={composeRef}
            variant="fullscreen"
            active={visible && isComposeMode}
            onPosted={() => {
              onPosted?.();
              onClose();
            }}
            liveAvailable={liveAvailable}
            onOpenLive={() => setMode("live")}
            onOpenSpace={() => setMode("space")}
            onComposeState={onComposeState}
          />
        </View>

        {mode === "live" ? (
          <GoLivePanel
            ref={liveRef}
            liveAvailable={liveAvailable}
            onDone={onClose}
            onPanelState={(s) => {
              setActionEnabled(s.canStart);
              setActionPending(s.isPending);
            }}
          />
        ) : null}

        {mode === "space" ? (
          <StartSpacePanel
            ref={spaceRef}
            liveAvailable={liveAvailable}
            onDone={onClose}
            onPanelState={(s) => {
              setActionEnabled(s.canStart);
              setActionPending(s.isPending);
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: OrblyColors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerSide: { minWidth: 80 },
  headerCenter: { flex: 1, alignItems: "center" },
  cancel: {
    color: OrblyColors.textPrimary,
    fontSize: 16,
    fontWeight: "400",
  },
  drafts: {
    color: OrblyColors.accent,
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.45,
  },
  modeTitle: {
    color: OrblyColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  postBtn: {
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  panel: { flex: 1 },
  panelHidden: { display: "none" },
});
