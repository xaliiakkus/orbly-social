import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { OrblyColors } from "@/constants/Colors";
import { KVKK_INTRO, KVKK_SECTIONS } from "@/lib/legal-content";

export default function KvkkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Pressable
        style={styles.backRow}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
      >
        <FontAwesome name="arrow-left" size={18} color={OrblyColors.textPrimary} />
        <Text style={styles.backText}>Geri</Text>
      </Pressable>
      <LegalDocument
        title="KVKK Aydınlatma Metni"
        intro={KVKK_INTRO}
        sections={KVKK_SECTIONS}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: OrblyColors.bgPrimary },
  container: { paddingHorizontal: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: "700", color: OrblyColors.textPrimary },
});
