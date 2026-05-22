import { formatUserError } from "@orbly/api-client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { AccountLimitModal } from "@/components/AccountLimitModal";
import { OrblyLogo } from "@/components/OrblyLogo";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { OAuthButtons } from "@/components/OAuthButtons";
import { OrblyColors } from "@/constants/Colors";
import { cancelAddAccount } from "@/lib/cancel-add-account";
import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket, reconnectSocket } from "@/lib/socket";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";

type AuthView = "login" | "forgot" | "forgot-sent" | "reset";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ addAccount?: string; resetToken?: string }>();
  const addAccount = params.addAccount === "1";
  const resetTokenParam =
    typeof params.resetToken === "string" ? params.resetToken : "";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [view, setView] = useState<AuthView>("login");
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("demo@orbly.social");
  const [password, setPassword] = useState("password123");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const savedCount = useDeviceAccountsStore((s) => s.accounts.length);
  const canAddNewAccount = useDeviceAccountsStore((s) => s.canAddNewAccount);

  useEffect(() => {
    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setView("reset");
      setError("");
      setSuccess("");
    }
  }, [resetTokenParam]);

  const goToLogin = (message?: string) => {
    setView("login");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(message ?? "");
    if (resetTokenParam) {
      router.replace("/login");
    }
  };

  const finishAuth = async (res: Parameters<typeof setAuth>[0]) => {
    if (useDeviceAccountsStore.getState().wouldExceedLimit(res.user.id)) {
      setLimitOpen(true);
      setError("Bu cihazda en fazla 3 hesap kullanılabilir.");
      return;
    }
    setAuth(res);
    reconnectSocket();
    await syncCurrentAccountToDevice();
    router.replace(res.user.onboarded ? "/(tabs)" : "/onboarding");
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (addAccount && !canAddNewAccount) {
      setLimitOpen(true);
      return;
    }
    setLoading(true);
    try {
      disconnectSocket();
      const res = await api.auth.login({ email, password });
      await finishAuth(res);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword({
        email: forgotEmail.trim(),
        username: forgotUsername.trim().toLowerCase(),
      });
      setSuccess(res.message);
      setView("forgot-sent");
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({
        token: resetToken,
        password: newPassword,
        confirmPassword,
      });
      goToLogin(res.message);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  const onOAuthSuccess = async (res: Parameters<typeof setAuth>[0]) => {
    try {
      await finishAuth(res);
    } catch {
      setError("Giriş tamamlanamadı.");
    }
  };

  const handleCancel = async () => {
    if (addAccount) {
      const result = await cancelAddAccount();
      router.replace(result.path as never);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const title =
    view === "forgot"
      ? "Şifremi unuttum"
      : view === "forgot-sent"
        ? "E-postanı kontrol et"
        : view === "reset"
          ? "Yeni şifre belirle"
          : addAccount
            ? "Başka hesap ekle"
            : "Orbly'ye giriş yap";

  if (view !== "login") {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backRow} onPress={() => (view === "forgot-sent" ? goToLogin() : setView("login"))}>
          <FontAwesome name="arrow-left" size={18} color={OrblyColors.textPrimary} />
          <Text style={styles.backText}>Giriş ekranına dön</Text>
        </Pressable>

        <OrblyLogo size="xl" style={styles.brandLogo} />
        <Text style={styles.title}>{title}</Text>

        {view === "forgot-sent" ? (
          <>
            {success ? <Text style={styles.success}>{success}</Text> : null}
            <Pressable style={styles.btn} onPress={() => goToLogin()}>
              <Text style={styles.btnText}>Giriş yap</Text>
            </Pressable>
          </>
        ) : view === "forgot" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={OrblyColors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı adı"
              placeholderTextColor={OrblyColors.textSecondary}
              autoCapitalize="none"
              value={forgotUsername}
              onChangeText={(v) => setForgotUsername(v.toLowerCase())}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.btn} onPress={() => void submitForgot()} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Sıfırlama bağlantısı gönder</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Yeni şifre"
              placeholderTextColor={OrblyColors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Yeni şifre (tekrar)"
              placeholderTextColor={OrblyColors.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={styles.btn}
              onPress={() => void submitReset()}
              disabled={loading || !resetToken}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Şifreyi kaydet</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {addAccount && (
        <Pressable style={styles.backRow} onPress={() => void handleCancel()}>
          <FontAwesome name="arrow-left" size={18} color={OrblyColors.textPrimary} />
          <Text style={styles.backText}>Önceki hesaba dön</Text>
        </Pressable>
      )}

      <OrblyLogo size="xl" style={styles.brandLogo} />
      <Text style={styles.title}>{title}</Text>
      {addAccount && (
        <Text style={styles.sub}>
          Bu cihazda kayıtlı hesap: {savedCount}/3
        </Text>
      )}

      {addAccount && (
        <Pressable style={styles.cancelBtn} onPress={() => void handleCancel()}>
          <Text style={styles.cancelBtnText}>Vazgeç</Text>
        </Pressable>
      )}

      {savedCount > 0 && (
        <View style={styles.switcherBox}>
          {addAccount && (
            <Text style={styles.switcherHint}>Kayıtlı hesaba geç</Text>
          )}
          <AccountSwitcher hideAddAccount={addAccount} loginMode />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="E-posta"
        placeholderTextColor={OrblyColors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor={OrblyColors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {!addAccount && (
        <Pressable
          style={styles.forgotLink}
          onPress={() => {
            setForgotEmail(email);
            setForgotUsername("");
            setError("");
            setSuccess("");
            setView("forgot");
          }}
        >
          <Text style={styles.forgotLinkText}>Şifremi unuttum</Text>
        </Pressable>
      )}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={() => void submit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>{addAccount ? "Hesabı ekle" : "Giriş yap"}</Text>
        )}
      </Pressable>
      <OAuthButtons onSuccess={onOAuthSuccess} />
      {!addAccount && (
        <Pressable onPress={() => router.push("/signup")} style={styles.linkWrap}>
          <Text style={styles.linkText}>Hesap oluştur</Text>
        </Pressable>
      )}

      <AccountLimitModal visible={limitOpen} onClose={() => setLimitOpen(false)} />
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
  sub: { color: OrblyColors.textSecondary, fontSize: 15, marginBottom: 16 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelBtnText: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 15 },
  switcherBox: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  switcherHint: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 13,
    color: OrblyColors.textSecondary,
  },
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
  forgotLink: { alignSelf: "flex-end", marginTop: -4, marginBottom: 12 },
  forgotLinkText: { color: OrblyColors.accent, fontSize: 14, fontWeight: "600" },
  error: { color: OrblyColors.like, marginBottom: 12 },
  success: { color: OrblyColors.accent, marginBottom: 12, fontSize: 15 },
  btn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  linkWrap: { marginTop: 16, alignItems: "center" },
  linkText: { color: OrblyColors.accent, fontSize: 15 },
});
