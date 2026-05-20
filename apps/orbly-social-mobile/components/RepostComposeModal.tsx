import { getRepostTargetPost } from "@orbly/features";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ComposeBox, type ComposeBoxHandle } from "@/components/ComposeBox";
import { RepostEmbed } from "@/components/RepostEmbed";
import { useRepostCompose } from "@/lib/repost-compose-context";
import { OrblyColors } from "@/constants/Colors";

export function RepostComposeModal({ onPosted }: { onPosted?: () => void }) {
  const insets = useSafeAreaInsets();
  const { quoteTarget, closeQuote } = useRepostCompose();
  const composeRef = useRef<ComposeBoxHandle>(null);
  const [composeSession, setComposeSession] = useState(0);
  const [canPost, setCanPost] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const visible = !!quoteTarget;

  useEffect(() => {
    if (!visible) setComposeSession((n) => n + 1);
  }, [visible, quoteTarget?.id]);

  const handlePosted = useCallback(() => {
    onPosted?.();
    closeQuote();
  }, [closeQuote, onPosted]);

  const onComposeState = useCallback((s: { canPost: boolean; isPending: boolean }) => {
    setCanPost(s.canPost);
    setIsPending(s.isPending);
  }, []);

  if (!quoteTarget) return null;

  const target = getRepostTargetPost(quoteTarget);
  const quoteContext = (
    <>
      <RepostEmbed post={target} />
      <Text style={styles.hint}>Alıntı olarak paylaş</Text>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeQuote}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={closeQuote} hitSlop={12}>
            <Text style={styles.cancel}>İptal et</Text>
          </Pressable>
          <Text style={styles.title}>Alıntıla</Text>
          <Pressable
            onPress={() => composeRef.current?.submit()}
            disabled={!canPost || isPending}
            style={[styles.postBtn, (!canPost || isPending) && styles.postBtnDisabled]}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postBtnText}>Alıntıla</Text>
            )}
          </Pressable>
        </View>
        <ComposeBox
          ref={composeRef}
          variant="reply-fullscreen"
          submitInHeader
          quoteRepostId={target.id}
          focusSession={`quote-${target.id}-${composeSession}`}
          replyContext={quoteContext}
          onPosted={handlePosted}
          onComposeState={onComposeState}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  cancel: { color: OrblyColors.textPrimary, fontSize: 16 },
  title: { color: OrblyColors.textPrimary, fontSize: 16, fontWeight: "700" },
  postBtn: {
    backgroundColor: OrblyColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: { color: OrblyColors.textSecondary, fontSize: 13, marginTop: 8 },
});
