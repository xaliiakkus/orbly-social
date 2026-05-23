import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

type AuthLegalLinksProps = {
  variant?: "login" | "signup";
};

export function AuthLegalLinks({ variant = "login" }: AuthLegalLinksProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        {variant === "signup"
          ? "Kayıt olarak aşağıdaki metinleri okuduğunu ve kabul ettiğini beyan edersin."
          : "Giriş yaparak aşağıdaki metinlere tabi olursun."}
      </Text>
      <View style={styles.links}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/privacy")}
          hitSlop={6}
        >
          <Text style={styles.link}>Gizlilik Politikası</Text>
        </Pressable>
        <Text style={styles.sep}> · </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/kvkk")}
          hitSlop={6}
        >
          <Text style={styles.link}>KVKK Aydınlatma Metni</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, alignItems: "center" },
  text: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: OrblyColors.textSecondary,
    marginBottom: 8,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  link: { color: OrblyColors.accent, fontSize: 13, fontWeight: "700" },
  sep: { color: OrblyColors.textSecondary, fontSize: 13 },
});
