import { POST_MAX_LENGTH } from "@orbly/features";
import type { PostPublic } from "@orbly/types";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DialogHeaderButton, OrblyDialog } from "@/components/ui/Dialog";
import { OrblyColors } from "@/constants/Colors";

export function EditPostModal({
  post,
  visible,
  saving,
  error,
  onClose,
  onSave,
}: {
  post: PostPublic;
  visible: boolean;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    if (visible) setContent(post.content);
  }, [visible, post.content]);

  const remaining = POST_MAX_LENGTH - content.length;
  const canSave = !saving && !!content.trim();

  return (
    <OrblyDialog
      visible={visible}
      onClose={onClose}
      title="Gönderiyi düzenle"
      size="md"
      headerLeft={<DialogHeaderButton label="İptal" onPress={onClose} disabled={saving} />}
      headerRight={
        saving ? (
          <ActivityIndicator size="small" color={OrblyColors.accent} />
        ) : (
          <DialogHeaderButton
            label="Kaydet"
            accent
            disabled={!canSave}
            onPress={() => onSave(content)}
          />
        )
      }
    >
      <View style={styles.body}>
        <TextInput
          value={content}
          onChangeText={(t) => setContent(t.slice(0, POST_MAX_LENGTH))}
          multiline
          style={styles.input}
          placeholderTextColor={OrblyColors.textSecondary}
          autoFocus
        />
        <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>{remaining}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </OrblyDialog>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 12 },
  input: {
    minHeight: 100,
    maxHeight: 280,
    fontSize: 17,
    lineHeight: 24,
    color: OrblyColors.textPrimary,
    textAlignVertical: "top",
  },
  counter: {
    textAlign: "right",
    marginTop: 8,
    color: OrblyColors.textSecondary,
    fontSize: 13,
  },
  counterWarn: { color: OrblyColors.like },
  error: { color: OrblyColors.like, marginTop: 10, fontSize: 14 },
});
