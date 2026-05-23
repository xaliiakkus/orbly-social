import { formatUserError } from "@orbly/api-client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthLegalLinks } from "@/components/legal/AuthLegalLinks";
import { OAuthButtons } from "@/components/OAuthButtons";
import { OrblyLogo } from "@/components/OrblyLogo";
import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { reconnectSocket } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";

const FIELDS = [
  { key: "displayName" as const, label: "Ad", secure: false },
  { key: "username" as const, label: "Kullanıcı adı", secure: false },
  { key: "email" as const, label: "E-posta", secure: false },
  { key: "password" as const, label: "Şifre", secure: true },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    const payload = {
      displayName: form.displayName.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim(),
      password: form.password,
    };
    if (!payload.displayName || !payload.username || !payload.email || !payload.password) {
      setError("Tüm alanları doldur.");
      return;
    }
    if (payload.password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register(payload);
      setAuth(res);
      reconnectSocket(res.tokens.accessToken);
      await syncCurrentAccountToDevice();
      router.replace(res.user.onboarded ? "/(tabs)" : "/onboarding");
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.backRow} onPress={() => router.replace("/login")}>
        <FontAwesome name="arrow-left" size={18} color={OrblyColors.textPrimary} />
        <Text style={styles.backText}>Giriş ekranına dön</Text>
      </Pressable>

      <OrblyLogo size="xl" style={styles.brandLogo} />
      <Text style={styles.title}>Hesap oluştur</Text>
      <Text style={styles.sub}>E-posta ile kayıt ol veya hızlıca devam et.</Text>

      {FIELDS.map(({ key, label, secure }) => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={label}
          placeholderTextColor={OrblyColors.textSecondary}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={key === "email" ? "email-address" : "default"}
          value={form[key]}
          onChangeText={(v) =>
            setForm({
              ...form,
              [key]: key === "username" ? v.toLowerCase() : v,
            })
          }
        />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.btn} onPress={() => void submit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>Kayıt ol</Text>
        )}
      </Pressable>

      <OAuthButtons
        onSuccess={async (res) => {
          setAuth(res);
          reconnectSocket(res.tokens.accessToken);
          await syncCurrentAccountToDevice();
          router.replace(res.user.onboarded ? "/(tabs)" : "/onboarding");
        }}
      />

      <AuthLegalLinks variant="signup" />

      <View style={styles.loginRow}>
        <Text style={styles.loginMuted}>Zaten hesabın var mı? </Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")} hitSlop={8}>
          <Text style={styles.loginLink}>Giriş yap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  container: { padding: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: "700", color: OrblyColors.textPrimary },
  brandLogo: { alignSelf: "center", marginBottom: 20 },
  title: { color: OrblyColors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 8 },
  sub: { color: OrblyColors.textSecondary, fontSize: 15, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 4,
    padding: 16,
    color: OrblyColors.textPrimary,
    marginBottom: 12,
    fontSize: 17,
    backgroundColor: OrblyColors.bgPrimary,
  },
  error: { color: OrblyColors.like, marginBottom: 12 },
  btn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 24,
  },
  loginMuted: { color: OrblyColors.textSecondary, fontSize: 15 },
  loginLink: { color: OrblyColors.accent, fontSize: 15, fontWeight: "700" },
});
