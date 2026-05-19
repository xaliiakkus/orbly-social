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
import { ReplyTargetPreview } from "@/components/ReplyTargetPreview";
import { useReplyCompose } from "@/lib/reply-compose-context";
import { OrblyColors } from "@/constants/Colors";

export function ReplyComposeModal({ onPosted }: { onPosted?: () => void }) {
  const insets = useSafeAreaInsets();
  const { targetPost, closeReply } = useReplyCompose();
  const composeRef = useRef<ComposeBoxHandle>(null);
  const [composeSession, setComposeSession] = useState(0);
  const [canPost, setCanPost] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const visible = !!targetPost;

  useEffect(() => {
    if (!visible) setComposeSession((n) => n + 1);
  }, [visible, targetPost?.id]);

  const handlePosted = useCallback(() => {
    onPosted?.();
    closeReply();
  }, [closeReply, onPosted]);

  const onComposeState = useCallback((s: { canPost: boolean; isPending: boolean }) => {
    setCanPost(s.canPost);
    setIsPending(s.isPending);
  }, []);

  const handleSubmit = () => composeRef.current?.submit();

  if (!targetPost) return null;

  const replyContext = (
    <>
      <ReplyTargetPreview post={targetPost} />
      <Text style={styles.replyingTo}>
        <Text style={styles.replyingToUser}>@{targetPost.author.username}</Text> adlı kişiye yanıt
        olarak
      </Text>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeReply}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={closeReply} hitSlop={12} style={styles.headerSide}>
            <Text style={styles.cancel}>İptal et</Text>
          </Pressable>
          <Text style={styles.drafts}>Taslaklar</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canPost || isPending}
            style={[styles.postBtn, (!canPost || isPending) && styles.postBtnDisabled]}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postBtnText}>Yanıtla</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.compose}>
          <ComposeBox
            key={`${composeSession}-${targetPost.id}`}
            ref={composeRef}
            variant="reply-fullscreen"
            submitInHeader
            replyToId={targetPost.id}
            replyToUsername={targetPost.author.username}
            replyContext={replyContext}
            focusSession={targetPost.id}
            active={visible}
            onPosted={handlePosted}
            onComposeState={onComposeState}
          />
        </View>
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
  cancel: {
    color: OrblyColors.textPrimary,
    fontSize: 16,
  },
  drafts: {
    flex: 1,
    textAlign: "center",
    color: OrblyColors.textSecondary,
    fontSize: 16,
    opacity: 0.45,
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
  compose: { flex: 1 },
  replyingTo: {
    color: OrblyColors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 52,
  },
  replyingToUser: {
    color: OrblyColors.accent,
    fontWeight: "700",
  },
});
