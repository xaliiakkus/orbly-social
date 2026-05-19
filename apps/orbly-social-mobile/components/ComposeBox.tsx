import {
  MAX_MEDIA_PER_POST,
  MIN_POLL_OPTIONS,
  POST_MAX_LENGTH,
  useComposePost,
  useLiveList,
} from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GifPicker } from "@/components/GifPicker";
import { IonIcon } from "@/components/ui/IconGlyphs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth-store";

type MediaItem = { uri: string; name: string; type: string };

export type ComposeBoxHandle = {
  submit: () => void;
};

type ComposeState = { canPost: boolean; isPending: boolean };

type Props = {
  replyToId?: string;
  replyToUsername?: string;
  /** Yanıt hedefini köke döndür (X tarzı iptal). */
  onClearReply?: () => void;
  onPosted?: () => void;
  /** inline: feed; reply: eski alt çubuk; fullscreen: gönderi; reply-fullscreen: X yanıt */
  variant?: "inline" | "reply" | "fullscreen" | "reply-fullscreen";
  submitInHeader?: boolean;
  replyContext?: ReactNode;
  focusSession?: number | string;
  /** false iken üst bar durumu güncellenmez (live/space modunda gizli compose) */
  active?: boolean;
  onComposeState?: (state: ComposeState) => void;
  liveAvailable?: boolean;
  onOpenLive?: () => void;
  onOpenSpace?: () => void;
};

export const ComposeBox = forwardRef<ComposeBoxHandle, Props>(function ComposeBox(
  {
    replyToId,
    replyToUsername,
    onClearReply,
    onPosted,
    variant = "inline",
    active = true,
    submitInHeader = false,
    replyContext,
    focusSession = 0,
    onComposeState,
    liveAvailable: liveAvailableProp,
    onOpenLive,
    onOpenSpace,
  },
  ref,
) {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const isFullscreen = variant === "fullscreen";
  const isReplyFullscreen = variant === "reply-fullscreen";
  const isReply = variant === "reply";
  const isXLayout = isFullscreen || isReplyFullscreen;

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const [gifOpen, setGifOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: liveData } = useLiveList();
  const liveAvailable = liveAvailableProp ?? liveData?.configured !== false;
  const compose = useComposePost();

  const totalMedia = media.length + gifUrls.length;
  const remaining = POST_MAX_LENGTH - content.length;
  const canPost =
    (content.trim().length > 0 || totalMedia > 0) &&
    (!pollOptions || pollOptions.filter((o) => o.trim()).length >= MIN_POLL_OPTIONS);

  useEffect(() => {
    if (!active) return;
    onComposeState?.({ canPost, isPending: compose.isPending });
  }, [active, canPost, compose.isPending, onComposeState]);

  useEffect(() => {
    if (!active || !isXLayout) return;
    const t1 = setTimeout(() => inputRef.current?.focus(), 50);
    const t2 = setTimeout(() => inputRef.current?.focus(), 280);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, isXLayout, focusSession]);

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const next = assets
      .slice(0, MAX_MEDIA_PER_POST - totalMedia)
      .map((a) => ({
        uri: a.uri,
        name: a.fileName ?? (a.type === "video" ? "video.mp4" : "photo.jpg"),
        type: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"),
      }));
    setMedia((m) => [...m, ...next].slice(0, MAX_MEDIA_PER_POST - gifUrls.length));
  };

  const pickImage = async () => {
    if (totalMedia >= MAX_MEDIA_PER_POST) return;
    setUploadError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Galeri izni gerekli",
        "Fotoğraf eklemek için ayarlardan galeri erişimine izin ver.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!res.canceled) addAssets(res.assets);
  };

  const takePhoto = async () => {
    if (totalMedia >= MAX_MEDIA_PER_POST) return;
    setUploadError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Kamera izni gerekli", "Fotoğraf çekmek için kamera erişimine izin ver.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!res.canceled) addAssets(res.assets);
  };

  const removeMedia = (uri: string) => setMedia((m) => m.filter((x) => x.uri !== uri));
  const removeGif = (url: string) => setGifUrls((g) => g.filter((x) => x !== url));

  const submit = useCallback(() => {
    if (!canPost || compose.isPending) return;
    setUploadError(null);
    compose.mutate(
      {
        content: content.trim() || " ",
        mediaUris: media,
        externalMediaUrls: gifUrls,
        replyToId,
        pollOptions: pollOptions ?? undefined,
      },
      {
        onSuccess: () => {
          setContent("");
          setMedia([]);
          setGifUrls([]);
          setPollOptions(null);
          onPosted?.();
        },
        onError: (err) => setUploadError(formatUserError(err)),
      },
    );
  }, [canPost, compose, content, media, gifUrls, pollOptions, replyToId, onPosted]);

  useImperativeHandle(ref, () => ({ submit }), [submit]);

  if (!user) return null;

  const placeholder = isReplyFullscreen
    ? "Yanıtını gönder"
    : replyToUsername
      ? `@${replyToUsername} kullanıcısına yanıt yaz`
      : replyToId
        ? "Yanıtını yaz"
        : isFullscreen
          ? "Neler oluyor?"
          : "Ne oluyor?";

  const mediaBlock = (media.length > 0 || gifUrls.length > 0) && (
    <View style={[styles.mediaRow, isFullscreen && styles.mediaRowFs]}>
      {media.map((m) => (
        <View key={m.uri} style={styles.thumbWrap}>
          <Image source={{ uri: m.uri }} style={styles.thumb} />
          <Pressable
            style={styles.thumbRemove}
            onPress={() => removeMedia(m.uri)}
            hitSlop={8}
            accessibilityLabel="Kaldır"
          >
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        </View>
      ))}
      {gifUrls.map((url) => (
        <View key={url} style={styles.thumbWrap}>
          <Image source={{ uri: url }} style={styles.thumb} />
          <Pressable
            style={styles.thumbRemove}
            onPress={() => removeGif(url)}
            hitSlop={8}
            accessibilityLabel="GIF kaldır"
          >
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        </View>
      ))}
    </View>
  );

  const pollBlock = pollOptions && (
    <View style={[styles.pollBox, isFullscreen && styles.pollBoxFs]}>
      {pollOptions.map((opt, i) => (
        <TextInput
          key={i}
          style={styles.pollInput}
          placeholder={`Seçenek ${i + 1}`}
          placeholderTextColor={OrblyColors.textSecondary}
          value={opt}
          onChangeText={(t) => {
            const c = [...pollOptions];
            c[i] = t;
            setPollOptions(c);
          }}
        />
      ))}
    </View>
  );

  const renderToolbar = (compact?: boolean) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.toolbarScroll}
      style={compact ? styles.toolbarCompact : undefined}
    >
      <ComposeTool
        icon="image-outline"
        label="Medya"
        onPress={() => void pickImage()}
        disabled={totalMedia >= MAX_MEDIA_PER_POST}
      />
      <ComposeTool
        icon="camera-outline"
        label="Kamera"
        onPress={() => void takePhoto()}
        disabled={totalMedia >= MAX_MEDIA_PER_POST}
      />
      <ComposeTool
        icon="stats-chart-outline"
        label="Anket"
        onPress={() => setPollOptions(pollOptions ? null : ["", ""])}
        active={!!pollOptions}
      />
      {!compact && !replyToId && liveAvailable && isFullscreen && !isReplyFullscreen && onOpenLive ? (
        <Pressable
          style={styles.toolBtn}
          onPress={onOpenLive}
          accessibilityLabel="Yayın aç"
        >
          <Text style={styles.liveLabel}>LIVE</Text>
        </Pressable>
      ) : null}
      {!compact && !replyToId && liveAvailable && isFullscreen && !isReplyFullscreen && onOpenSpace ? (
        <ComposeTool
          icon="people-outline"
          label="Oda aç"
          onPress={onOpenSpace}
        />
      ) : null}
      <Pressable
        style={[styles.toolBtn, totalMedia >= MAX_MEDIA_PER_POST && styles.toolBtnDisabled]}
        onPress={() => setGifOpen(true)}
        disabled={totalMedia >= MAX_MEDIA_PER_POST}
        accessibilityLabel="GIF"
      >
        <Text
          style={[
            styles.gifLabel,
            totalMedia >= MAX_MEDIA_PER_POST && { color: OrblyColors.textSecondary },
          ]}
        >
          GIF
        </Text>
      </Pressable>
      {!compact ? (
        <>
          <ComposeTool icon="location-outline" label="Konum" disabled />
          <ComposeTool icon="add-outline" label="Zincir" disabled />
        </>
      ) : null}
    </ScrollView>
  );

  const toolbarWithCounter = (compact?: boolean) => (
    <View style={styles.toolbarRow}>
      <View style={styles.toolbarToolsFlex}>{renderToolbar(compact)}</View>
      <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>{remaining}</Text>
    </View>
  );

  const main = (
    <>
      <View style={[styles.row, isXLayout && styles.rowFs]}>
        <UserAvatar name={user.displayName} uri={user.avatarUrl} size="md" />
        <View style={styles.inputCol}>
          {isFullscreen && !isReplyFullscreen && !replyToId ? (
            <Pressable style={styles.audiencePill}>
              <Text style={styles.audienceText}>Herkes</Text>
              <Ionicons name="chevron-down" size={14} color={OrblyColors.accent} />
            </Pressable>
          ) : null}
          <TextInput
            ref={inputRef}
            style={[styles.input, isXLayout && styles.inputFs]}
            placeholder={placeholder}
            placeholderTextColor={OrblyColors.textSecondary}
            multiline
            autoFocus={isFullscreen && !isReplyFullscreen}
            value={content}
            onChangeText={(t) => setContent(t.slice(0, POST_MAX_LENGTH))}
          />
        </View>
      </View>

      {mediaBlock}
      {pollBlock}
      {uploadError ? (
        <Text style={[styles.error, isFullscreen && styles.errorFs]}>{uploadError}</Text>
      ) : null}
    </>
  );

  const modals = (
    <GifPicker
      visible={gifOpen}
      onClose={() => setGifOpen(false)}
      onSelect={(gif) =>
        setGifUrls((g) => [...g, gif.url].slice(0, MAX_MEDIA_PER_POST - media.length))
      }
    />
  );

  if (isReplyFullscreen) {
    return (
      <KeyboardAvoidingView
        style={styles.fsRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 48 : 0}
      >
        <ScrollView
          style={styles.fsScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fsContent}>
            {replyContext}
            {main}
          </View>
        </ScrollView>
        <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {toolbarWithCounter(true)}
        </View>
        {modals}
      </KeyboardAvoidingView>
    );
  }

  if (isReply) {
    return (
      <View style={[styles.replyBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {replyToUsername ? (
          <View style={styles.replyingToRow}>
            <Text style={styles.replyingTo}>
              Yanıtlanıyor <Text style={styles.replyingToUser}>@{replyToUsername}</Text>
            </Text>
            {onClearReply ? (
              <Pressable onPress={onClearReply} hitSlop={10} accessibilityLabel="Yanıt hedefini kaldır">
                <Ionicons name="close" size={20} color={OrblyColors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={styles.replyTopRow}>
          <UserAvatar name={user.displayName} uri={user.avatarUrl} size="md" />
          <TextInput
            style={styles.replyInput}
            placeholder={placeholder}
            placeholderTextColor={OrblyColors.textSecondary}
            multiline
            value={content}
            onChangeText={(t) => setContent(t.slice(0, POST_MAX_LENGTH))}
          />
        </View>

        {mediaBlock}
        {pollBlock}
        {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}

        <View style={styles.replyFooter}>
          <View style={styles.replyTools}>{renderToolbar(true)}</View>
          <View style={styles.replySubmitCol}>
            {content.length > 0 ? (
              <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>
                {remaining}
              </Text>
            ) : null}
            <Pressable
              style={[styles.replyBtn, !canPost && styles.btnDisabled]}
              onPress={submit}
              disabled={!canPost || compose.isPending}
            >
              {compose.isPending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.btnText}>Yanıtla</Text>
              )}
            </Pressable>
          </View>
        </View>
        {modals}
      </View>
    );
  }

  if (isFullscreen) {
    return (
      <KeyboardAvoidingView
        style={styles.fsRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 48 : 0}
      >
        <ScrollView
          style={styles.fsScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fsContent}>{main}</View>
        </ScrollView>

        {!replyToId ? (
          <View style={styles.replyRow}>
            <View style={styles.replyLeft}>
              <Ionicons name="globe-outline" size={16} color={OrblyColors.accent} />
              <Text style={styles.replyText}>Herkes yanıtlayabilir</Text>
            </View>
            <View style={styles.replyActions}>
              <Ionicons name="return-up-back" size={20} color={OrblyColors.textTertiary} />
              <Ionicons name="return-up-forward" size={20} color={OrblyColors.textTertiary} />
            </View>
          </View>
        ) : null}

        <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {toolbarWithCounter()}
        </View>
        {modals}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.wrap}>
      {main}
      <View style={styles.footer}>
        <View style={styles.tools}>{renderToolbar()}</View>
        <View style={styles.postCol}>
          {content.length > 0 ? (
            <Text style={[styles.counter, remaining < 20 && styles.counterWarn]}>{remaining}</Text>
          ) : null}
          <Pressable
            style={[styles.btn, !canPost && styles.btnDisabled]}
            onPress={submit}
            disabled={!canPost || compose.isPending}
          >
            {compose.isPending ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.btnText}>Gönder</Text>
            )}
          </Pressable>
        </View>
      </View>
      {modals}
    </View>
  );
});

function ComposeTool({
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[styles.toolBtn, active && styles.toolBtnActive, disabled && styles.toolBtnDisabled]}
      accessibilityLabel={label}
    >
      <IonIcon
        name={icon}
        size={22}
        color={disabled ? OrblyColors.textTertiary : OrblyColors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fsRoot: { flex: 1 },
  fsScroll: { flex: 1 },
  fsContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  rowFs: { alignItems: "flex-start" },
  inputCol: { flex: 1, gap: 10 },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrblyColors.accent,
  },
  audienceText: { color: OrblyColors.accent, fontWeight: "700", fontSize: 14 },
  input: {
    flex: 1,
    color: OrblyColors.textPrimary,
    fontSize: 19,
    lineHeight: 26,
    minHeight: 56,
    maxHeight: 120,
    paddingTop: 4,
  },
  inputFs: {
    fontSize: 20,
    lineHeight: 28,
    minHeight: 120,
    paddingTop: 0,
  },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginLeft: 52 },
  mediaRowFs: { marginLeft: 52, marginTop: 16 },
  thumbWrap: { position: "relative" },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  pollBox: { marginTop: 12, marginLeft: 52, gap: 8 },
  pollBoxFs: { marginLeft: 52 },
  pollInput: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 12,
    padding: 12,
    color: OrblyColors.textPrimary,
    fontSize: 15,
    backgroundColor: OrblyColors.bgSecondary,
  },
  error: { color: OrblyColors.like, fontSize: 14, marginTop: 8, marginLeft: 52 },
  errorFs: { marginLeft: 52 },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
  },
  replyLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  replyText: { color: OrblyColors.accent, fontSize: 14, fontWeight: "600" },
  replyActions: { flexDirection: "row", gap: 16 },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  toolbarScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  toolbarToolsFlex: {
    flex: 1,
    minWidth: 0,
  },
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  replyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    backgroundColor: OrblyColors.bgPrimary,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  replyingToRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  replyingTo: {
    color: OrblyColors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  replyingToUser: { color: OrblyColors.accent, fontWeight: "700" },
  replyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  replyInput: {
    flex: 1,
    minWidth: 0,
    color: OrblyColors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    minHeight: 40,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 4,
  },
  replyFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 50,
    gap: 6,
  },
  replyTools: {
    flex: 1,
    minWidth: 0,
  },
  toolbarCompact: {
    flexGrow: 0,
  },
  replySubmitCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  replyBtn: {
    backgroundColor: OrblyColors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingLeft: 52,
  },
  tools: { flexDirection: "row", alignItems: "center", marginLeft: -8 },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnActive: { backgroundColor: "rgba(29, 155, 240, 0.12)" },
  toolBtnDisabled: { opacity: 0.35 },
  gifLabel: {
    color: OrblyColors.accent,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  liveLabel: {
    color: OrblyColors.accent,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
    borderWidth: 1.5,
    borderColor: OrblyColors.accent,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  postCol: { flexDirection: "row", alignItems: "center", gap: 12 },
  counter: { color: OrblyColors.textSecondary, fontSize: 13, fontVariant: ["tabular-nums"] },
  counterWarn: { color: OrblyColors.like },
  btn: {
    backgroundColor: OrblyColors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 72,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#000", fontWeight: "700", fontSize: 15 },
});
