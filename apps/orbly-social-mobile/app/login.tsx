import { formatUserError } from "@orbly/api-client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthLegalLinks } from "@/components/legal/AuthLegalLinks";
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
import { ORBLY_SUPPORT_EMAIL, supportMailto } from "@/lib/app-contact";
import {
  extractResetTokenFromUrl,
  parseRouteParam,
} from "@/lib/password-reset-link";
import { syncCurrentAccountToDevice } from "@/lib/sync-saved-account";

type AuthView = "login" | "forgot" | "forgot-sent" | "reset";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ addAccount?: string; resetToken?: string }>();
  const addAccount = params.addAccount === "1";
  const resetTokenParam = parseRouteParam(params.resetToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [view, setView] = useState<AuthView>("login");
  const [resetToken, setResetToken] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
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

  const openResetWithToken = (token: string) => {
    if (!token) return;
    setResetToken(token);
    setView("reset");
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (resetTokenParam) openResetWithToken(resetTokenParam);
  }, [resetTokenParam]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const token = extractResetTokenFromUrl(url);
      if (token) openResetWithToken(token);
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const goToLogin = (message?: string) => {
    setView("login");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(message ?? "");
    if (resetTokenParam) router.replace("/login");
  };

  const finishAuth = async (res: Parameters<typeof setAuth>[0]) => {
    if (useDeviceAccountsStore.getState().wouldExceedLimit(res.user.id)) {
      setLimitOpen(true);
      setError("Bu cihazda en fazla 3 hesap kullanılabilir.");
      return;
    }
    setAuth(res);
    reconnectSocket(res.tokens.accessToken);
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
      const res = await api.auth.login({ login: login.trim(), password });
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
        <Pressable
          style={styles.backRow}
          onPress={() => (view === "forgot-sent" ? goToLogin() : setView("login"))}
        >
          <FontAwesome name="arrow-left" size={18} color={OrblyColors.textPrimary} />
          <Text style={styles.backText}>Giriş ekranına dön</Text>
        </Pressable>

        <OrblyLogo size="xl" style={styles.brandLogo} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {view === "forgot"
            ? "Kayıtlı e-posta ve kullanıcı adını gir; sıfırlama bağlantısı gönderilir."
            : view === "forgot-sent"
              ? "Eşleşen hesap varsa e-postana bağlantı geldi (web veya uygulama)."
              : "Yeni şifreni iki kez gir; ardından giriş ekranına dönersin."}
        </Text>

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
        <Text style={styles.sub}>Bu cihazda kayıtlı hesap: {savedCount}/3</Text>
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
        placeholder="E-posta veya kullanıcı adı"
        placeholderTextColor={OrblyColors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        value={login}
        onChangeText={(v) => setLogin(v.includes("@") ? v : v.toLowerCase())}
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
          style={styles.forgotWrap}
          onPress={() => {
            const trimmed = login.trim();
            if (trimmed.includes("@")) {
              setForgotEmail(trimmed);
              setForgotUsername("");
            } else {
              setForgotEmail("");
              setForgotUsername(trimmed.toLowerCase());
            }
            setError("");
            setSuccess("");
            setView("forgot");
          }}
        >
          <Text style={styles.forgotText}>Şifremi unuttum</Text>
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
      {!addAccount && (
        <View style={styles.signupRow}>
          <Text style={styles.signupMuted}>Hesabın yok mu? </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace("/signup")}
            hitSlop={8}
          >
            <Text style={styles.signupLink}>Kayıt ol</Text>
          </Pressable>
        </View>
      )}
      <OAuthButtons onSuccess={onOAuthSuccess} />

      {!addAccount && <AuthLegalLinks variant="login" />}

      <Text style={styles.supportHint}>
        Destek:{" "}
        <Text
          style={styles.supportLink}
          onPress={() => void Linking.openURL(supportMailto("Destek"))}
        >
          {ORBLY_SUPPORT_EMAIL}
        </Text>
      </Text>

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
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 20,
    marginBottom: 4,
  },
  signupMuted: { color: OrblyColors.textSecondary, fontSize: 15 },
  signupLink: { color: OrblyColors.accent, fontSize: 15, fontWeight: "700" },
  forgotWrap: { alignSelf: "flex-end", marginBottom: 12, marginTop: -4 },
  forgotText: { color: OrblyColors.accent, fontSize: 14, fontWeight: "600" },
  supportHint: {
    marginTop: 20,
    textAlign: "center",
    color: OrblyColors.textSecondary,
    fontSize: 13,
  },
  supportLink: { color: OrblyColors.accent, fontWeight: "600" },
});
