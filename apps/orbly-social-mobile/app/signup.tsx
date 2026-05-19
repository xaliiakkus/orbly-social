import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";

import { OAuthButtons } from "@/components/OAuthButtons";
import { OrblyLogo } from "@/components/OrblyLogo";
import { formatUserError } from "@orbly/api-client";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";

export default function SignupScreen() {
  const router = useRouter();
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
    setLoading(true);
    try {
      const res = await api.auth.register(form);
      setAuth(res);
      await syncCurrentAccountToDevice();
      router.replace("/onboarding");
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <OrblyLogo size="xl" style={styles.brandLogo} />
      <Text style={styles.title}>Hesap oluştur</Text>
      {(["displayName", "username", "email", "password"] as const).map((key) => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={key === "displayName" ? "Ad" : key === "username" ? "Kullanıcı adı" : key === "email" ? "E-posta" : "Şifre"}
          placeholderTextColor={OrblyColors.textSecondary}
          secureTextEntry={key === "password"}
          autoCapitalize="none"
          value={form[key]}
          onChangeText={(v) => setForm({ ...form, [key]: v })}
        />
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Kayıt ol</Text>}
      </Pressable>
      <OAuthButtons
        onSuccess={(res) => {
          setAuth(res);
          router.replace(res.user.onboarded ? "/(tabs)" : "/onboarding");
        }}
      />
      <Link href="/login" style={styles.link}>
        <Text style={styles.linkText}>Giriş yap</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary, padding: 24, justifyContent: "center" },
  brandLogo: { alignSelf: "center", marginBottom: 20 },
  title: { color: OrblyColors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 4,
    padding: 14,
    color: OrblyColors.textPrimary,
    marginBottom: 12,
    fontSize: 15,
  },
  error: { color: OrblyColors.like, marginBottom: 12 },
  btn: { backgroundColor: OrblyColors.textPrimary, borderRadius: 999, padding: 14, alignItems: "center" },
  btnText: { color: "#000", fontWeight: "700" },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: OrblyColors.accent },
});
