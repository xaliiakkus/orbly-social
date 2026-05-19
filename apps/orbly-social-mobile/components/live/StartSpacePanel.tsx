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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";

export type StartSpacePanelHandle = { start: () => void };

type PanelState = { canStart: boolean; isPending: boolean };

type Props = {
  liveAvailable?: boolean;
  onDone?: () => void;
  onPanelState?: (state: PanelState) => void;
};

export const StartSpacePanel = forwardRef<StartSpacePanelHandle, Props>(function StartSpacePanel(
  { liveAvailable = true, onDone, onPanelState },
  ref,
) {
  const router = useRouter();
  const [title, setTitle] = useState("");
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
        title: title.trim() || "Sohbet odası",
        kind: "space",
      });
      onDone?.();
      router.push(`/live/${res.channel.id}`);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  }, [liveAvailable, loading, title, onDone, router]);

  useImperativeHandle(ref, () => ({ start }), [start]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.lead}>
        Herkese açık sesli oda aç. Dinleyiciler konuşma isteyebilir.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Oda başlığı"
        placeholderTextColor={OrblyColors.textSecondary}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        autoFocus
      />
      {!liveAvailable ? (
        <Text style={styles.warn}>Sohbet odaları şu an kullanılamıyor.</Text>
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
  warn: { color: OrblyColors.textSecondary, fontSize: 14 },
  error: { color: OrblyColors.like, fontSize: 14 },
  loader: { marginTop: 8 },
});
