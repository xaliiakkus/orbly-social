import { formatUserError } from "@orbly/api-client";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function ForgotPasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(user?.username ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSent(false);
    setError("");
    setUsername(user?.username ?? "");
  }, [visible, user?.username]);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword({
        email: email.trim(),
        username: username.trim().toLowerCase(),
      });
      setSent(true);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Kapat</Text>
          </Pressable>
          <Text style={styles.title}>Şifre sıfırlama</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.body}>
          {sent ? (
            <Text style={styles.desc}>
              E-posta adresine şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam
              klasörünü kontrol et.
            </Text>
          ) : (
            <>
              <Text style={styles.desc}>
                Kayıtlı e-posta ve kullanıcı adını gir. Sıfırlama bağlantısı e-postana gönderilir.
              </Text>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={OrblyColors.textSecondary}
              />
              <Text style={styles.label}>Kullanıcı adı</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor={OrblyColors.textSecondary}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={[styles.btn, (loading || !email.trim() || !username.trim()) && styles.btnDisabled]}
                disabled={loading || !email.trim() || !username.trim()}
                onPress={() => void submit()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Gönder</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
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
  },
  cancel: { color: OrblyColors.textSecondary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: "800", color: OrblyColors.textPrimary },
  body: { padding: 16, gap: 12 },
  desc: { fontSize: 15, color: OrblyColors.textSecondary, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", color: OrblyColors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: OrblyColors.textPrimary,
    backgroundColor: OrblyColors.bgSecondary,
  },
  error: { color: OrblyColors.like, fontSize: 14 },
  btn: {
    marginTop: 8,
    backgroundColor: OrblyColors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
