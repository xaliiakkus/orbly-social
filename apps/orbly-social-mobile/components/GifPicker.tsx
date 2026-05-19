import type { GifItem } from "@orbly/types";
import { useGifSearch } from "@orbly/features";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DialogHeaderButton, OrblyDialog, useDialogLayout } from "@/components/ui/Dialog";
import { OrblyColors } from "@/constants/Colors";

function GifPickerBody({
  query,
  setQuery,
  isLoading,
  isError,
  data,
  onSelect,
  onClose,
}: {
  query: string;
  setQuery: (q: string) => void;
  isLoading: boolean;
  isError: boolean;
  data: { data: GifItem[] } | undefined;
  onSelect: (gif: GifItem) => void;
  onClose: () => void;
}) {
  const { bodyMaxHeight } = useDialogLayout();
  const listMaxHeight = Math.max(160, bodyMaxHeight - 56);

  return (
    <View style={styles.body}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="GIF ara…"
        placeholderTextColor={OrblyColors.textSecondary}
        autoFocus
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={OrblyColors.accent} />
      ) : null}
      {isError ? (
        <Text style={styles.hint}>GIF araması kullanılamıyor (API TENOR_API_KEY)</Text>
      ) : null}
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={{ maxHeight: listMaxHeight }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.cell}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          >
            <Image source={{ uri: item.previewUrl }} style={styles.thumb} />
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading && !isError ? <Text style={styles.hint}>Sonuç yok</Text> : null
        }
      />
    </View>
  );
}

export function GifPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (gif: GifItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, isLoading, isError } = useGifSearch(debounced, visible);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query, visible]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setDebounced("");
    }
  }, [visible]);

  return (
    <OrblyDialog
      visible={visible}
      onClose={onClose}
      title="GIF seç"
      size="md"
      headerRight={<DialogHeaderButton label="Kapat" onPress={onClose} accent />}
    >
      <GifPickerBody
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        isError={isError}
        data={data}
        onSelect={onSelect}
        onClose={onClose}
      />
    </OrblyDialog>
  );
}

const styles = StyleSheet.create({
  body: { padding: 12, gap: 10 },
  input: {
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  loader: { marginVertical: 24 },
  hint: { color: OrblyColors.textSecondary, textAlign: "center", padding: 24 },
  row: { gap: 8 },
  cell: {
    flex: 1,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
  thumb: { width: "100%", height: 110 },
});
