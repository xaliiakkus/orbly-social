import { formatUserError } from "@orbly/api-client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { Image } from "@/components/ui/expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AutoSaveStatus, type AutoSaveState } from "@/components/settings/AutoSaveStatus";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/lib/auth-store";
import type { UserPublic } from "@orbly/types";

type PickedMedia = { uri: string; name: string; type: string };

function fieldsEqual(
  fields: { displayName: string; bio: string; location: string; website: string },
  user: UserPublic,
) {
  return (
    fields.displayName.trim() === user.displayName &&
    (fields.bio.trim() || "") === (user.bio ?? "") &&
    (fields.location.trim() || "") === (user.location ?? "") &&
    (fields.website.trim() || "") === (user.website ?? "")
  );
}

export function EditProfileModal({
  user,
  visible,
  onClose,
  onSaved,
}: {
  user: UserPublic;
  visible: boolean;
  onClose: () => void;
  onSaved?: (u: UserPublic) => void;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [bannerPick, setBannerPick] = useState<PickedMedia | null>(null);
  const [avatarPick, setAvatarPick] = useState<PickedMedia | null>(null);
  const [saveState, setSaveState] = useState<AutoSaveState>("idle");
  const [error, setError] = useState("");

  const userRef = useRef(user);
  userRef.current = user;
  const savingRef = useRef(false);
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setDisplayName(user.displayName);
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setWebsite(user.website ?? "");
    setBannerPick(null);
    setAvatarPick(null);
    setError("");
    setSaveState("idle");
  }, [user]);

  useEffect(() => {
    if (visible) resetForm();
  }, [visible, resetForm]);

  const flashSaved = useCallback(() => {
    setSaveState("saved");
    if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
    savedFlashRef.current = setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  const persist = useCallback(async () => {
    if (!visible || savingRef.current) return;
    const u = userRef.current;
    const fields = { displayName, bio, location, website };
    const hasText = !fieldsEqual(fields, u);
    const hasMedia = !!bannerPick || !!avatarPick;
    if (!hasText && !hasMedia) return;
    if (!displayName.trim()) return;

    savingRef.current = true;
    setSaveState("saving");
    setError("");
    try {
      const payload: Record<string, unknown> = {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
      };

      if (bannerPick) {
        payload.bannerUrl = await uploadImage(
          bannerPick.uri,
          bannerPick.name,
          bannerPick.type,
        );
      }
      if (avatarPick) {
        payload.avatarUrl = await uploadImage(
          avatarPick.uri,
          avatarPick.name,
          avatarPick.type,
        );
      }

      const updated = await api.users.updateMe(payload);
      setUser(updated.user);
      userRef.current = updated.user;
      onSaved?.(updated.user);
      setBannerPick(null);
      setAvatarPick(null);
      flashSaved();
    } catch (e) {
      setError(formatUserError(e));
      setSaveState("error");
    } finally {
      savingRef.current = false;
    }
  }, [
    visible,
    displayName,
    bio,
    location,
    website,
    bannerPick,
    avatarPick,
    setUser,
    onSaved,
    flashSaved,
  ]);

  const { schedule: scheduleTextSave, flush } = useDebouncedCallback(persist, 650);

  useEffect(() => {
    if (!visible) return;
    if (!fieldsEqual({ displayName, bio, location, website }, userRef.current)) {
      scheduleTextSave();
    }
  }, [displayName, bio, location, website, visible, scheduleTextSave]);

  useEffect(() => {
    if (!visible) return;
    if (bannerPick || avatarPick) void persist();
  }, [bannerPick, avatarPick, visible, persist]);

  const handleClose = () => {
    void (async () => {
      await flush();
      onClose();
    })();
  };

  useEffect(
    () => () => {
      if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
    },
    [],
  );

  const pickImage = async (target: "banner" | "avatar") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Galeri izni gerekli",
        "Fotoğraf seçmek için ayarlardan galeri erişimine izin ver.",
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const picked: PickedMedia = {
      uri: asset.uri,
      name: asset.fileName ?? (target === "banner" ? "banner.jpg" : "avatar.jpg"),
      type: asset.mimeType ?? "image/jpeg",
    };
    if (target === "banner") setBannerPick(picked);
    else setAvatarPick(picked);
  };

  const bannerPreview = bannerPick?.uri ?? resolveMediaUrl(user.bannerUrl);
  const avatarPreview = avatarPick?.uri ?? resolveMediaUrl(user.avatarUrl);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.cancel}>Kapat</Text>
          </Pressable>
          <Text style={styles.title}>Profili düzenle</Text>
          <AutoSaveStatus state={saveState} error={error || undefined} />
        </View>

        <Text style={styles.note}>Değişiklikler otomatik kaydedilir.</Text>

        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.bannerWrap}>
            {bannerPreview ? (
              <Image source={{ uri: bannerPreview }} style={styles.banner} contentFit="cover" />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            <View style={styles.bannerOverlay}>
              <MediaPickButton
                label="Kapak fotoğrafı yükle"
                onPress={() => void pickImage("banner")}
                disabled={saveState === "saving"}
              />
            </View>
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{displayName.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.avatarOverlay}>
                <MediaPickButton
                  label="Profil fotoğrafı yükle"
                  onPress={() => void pickImage("avatar")}
                  disabled={saveState === "saving"}
                />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            <Field label="Görünen ad" value={displayName} onChangeText={setDisplayName} />
            <Field
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={160}
              placeholder="Kendinden bahset"
            />
            <Field label="Konum" value={location} onChangeText={setLocation} />
            <Field
              label="Web sitesi"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function MediaPickButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.mediaBtn, disabled && styles.mediaBtnDisabled]}
      accessibilityLabel={label}
    >
      {disabled ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <FontAwesome name="camera" size={20} color="#fff" />
      )}
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={OrblyColors.textSecondary}
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
    gap: 8,
  },
  cancel: { color: OrblyColors.textSecondary, fontSize: 16, minWidth: 48 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  note: {
    fontSize: 13,
    color: OrblyColors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  bannerWrap: {
    height: 140,
    backgroundColor: OrblyColors.bgSecondary,
    overflow: "hidden",
  },
  banner: { ...StyleSheet.absoluteFillObject },
  bannerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OrblyColors.bgTertiary,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: {
    paddingHorizontal: 16,
    marginTop: -42,
    marginBottom: 8,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: OrblyColors.bgPrimary,
    overflow: "hidden",
    backgroundColor: OrblyColors.bgTertiary,
  },
  avatar: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 28, fontWeight: "800", color: OrblyColors.textPrimary },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBtnDisabled: { opacity: 0.5 },
  form: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  field: { gap: 6 },
  label: { color: OrblyColors.textSecondary, fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 8,
    padding: 12,
    color: OrblyColors.textPrimary,
    fontSize: 16,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
});
