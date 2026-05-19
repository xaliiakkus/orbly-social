import { formatUserError } from "@orbly/api-client";
import { useRouter } from "expo-router";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

export type GoLivePanelHandle = { start: () => void };

type PanelState = { canStart: boolean; isPending: boolean };

type Props = {
  liveAvailable?: boolean;
  onDone?: () => void;
  onPanelState?: (state: PanelState) => void;
};

export const GoLivePanel = forwardRef<GoLivePanelHandle, Props>(function GoLivePanel(
  { liveAvailable = true, onDone, onPanelState },
  ref,
) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"audio" | "video">("video");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canStart = liveAvailable && !loading;

  useEffect(() => {
    onPanelState?.({ canStart, isPending: loading });
  }, [canStart, loading, onPanelState]);

  const start = useCallback(async () => {
    if (!liveAvailable || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.live.start({
        title: title.trim() || "Canlı yayın",
        mode,
      });
      onDone?.();
      router.push(`/live/${res.channel.id}`);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  }, [liveAvailable, loading, title, mode, onDone, router]);

  useImperativeHandle(ref, () => ({ start }), [start]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.lead}>Takipçilerinle görüntülü veya sesli yayın aç.</Text>
      <TextInput
        style={styles.input}
        placeholder="Yayın başlığı"
        placeholderTextColor={OrblyColors.textSecondary}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        autoFocus
      />
      <View style={styles.modes}>
        {(["video", "audio"] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
              {m === "video" ? "Görüntülü" : "Sesli"}
            </Text>
          </Pressable>
        ))}
      </View>
      {!liveAvailable ? (
        <Text style={styles.warn}>Canlı yayın şu an kullanılamıyor.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
      ) : null}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 12, gap: 12 },
  lead: { color: OrblyColors.textSecondary, fontSize: 15, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 12,
    padding: 14,
    color: OrblyColors.textPrimary,
    fontSize: 17,
    backgroundColor: OrblyColors.bgSecondary,
  },
  modes: { flexDirection: "row", gap: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    alignItems: "center",
  },
  modeActive: { backgroundColor: OrblyColors.accent, borderColor: OrblyColors.accent },
  modeText: { color: OrblyColors.textSecondary, fontWeight: "600", fontSize: 15 },
  modeTextActive: { color: "#fff" },
  warn: { color: OrblyColors.textSecondary, fontSize: 14 },
  error: { color: OrblyColors.like, fontSize: 14 },
  loader: { marginTop: 8 },
});
