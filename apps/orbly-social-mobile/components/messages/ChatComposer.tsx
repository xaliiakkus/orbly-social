import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

export function ChatComposer({
  text,
  onChangeText,
  onSend,
  onAttach,
  bottomInset,
  pending,
}: {
  text: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  bottomInset: number;
  pending?: boolean;
}) {
  const canSend = text.trim().length > 0 && !pending;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.bar}>
        {onAttach ? (
          <Pressable onPress={onAttach} style={styles.attachBtn} hitSlop={8}>
            <FontAwesome name="image" size={22} color={OrblyColors.accent} />
          </Pressable>
        ) : null}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={onChangeText}
          placeholder="Mesaj yaz…"
          placeholderTextColor={OrblyColors.textSecondary}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, !canSend && styles.sendDisabled]}
          disabled={!canSend}
          onPress={onSend}
        >
          <FontAwesome
            name="send"
            size={18}
            color={canSend ? "#fff" : OrblyColors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: OrblyColors.bgSecondary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OrblyColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    backgroundColor: OrblyColors.bgTertiary,
  },
});
