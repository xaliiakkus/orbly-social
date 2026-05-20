import { formatUserError } from "@orbly/api-client";
import {
  canCompleteOnboarding,
  onboardingHint,
  requiredOrbitSelections,
} from "@orbly/features";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { OrblyColors } from "@/constants/Colors";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { OrbitPublic } from "@orbly/types";

export default function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [orbits, setOrbits] = useState<OrbitPublic[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fetching, setFetching] = useState(true);

  const loadOrbits = () => {
    setFetching(true);
    setLoadError("");
    api.orbits
      .list()
      .then((r) => setOrbits(r.data))
      .catch((e) => {
        setOrbits([]);
        setLoadError(formatUserError(e));
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    loadOrbits();
  }, []);

  const required = requiredOrbitSelections(orbits.length);
  const canFinish = canCompleteOnboarding(selected.length, orbits.length);

  const completeOnboarding = async (orbitIds?: string[]) => {
    setSubmitError("");
    setLoading(true);
    try {
      const res = await api.auth.onboarding({
        orbitIds: orbitIds && orbitIds.length > 0 ? orbitIds : undefined,
        onboarded: true,
      });
      setUser(res.user);
      router.replace("/(tabs)");
    } catch (e) {
      setSubmitError(formatUserError(e));
    } finally {
      setLoading(false);
    }
  };

  const skip = () => void completeOnboarding();

  const finish = () => {
    if (!canFinish && orbits.length > 0) return;
    void completeOnboarding(selected);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>İlgi alanlarını seç</Text>
        <Pressable onPress={skip} disabled={loading}>
          <Text style={styles.skip}>Atla</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>{onboardingHint(orbits.length)}</Text>

      {fetching && <ActivityIndicator color={OrblyColors.accent} style={styles.loader} />}

      {loadError ? (
        <View style={styles.center}>
          <Text style={styles.error}>{loadError}</Text>
          <Pressable onPress={loadOrbits}>
            <Text style={styles.retry}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : null}

      {!fetching && !loadError && (
        <FlatList
          data={orbits}
          numColumns={2}
          keyExtractor={(o) => o.id}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <Text style={styles.empty}>Henüz orbit yok. Devam edebilirsin.</Text>
          }
          renderItem={({ item }) => {
            const on = selected.includes(item.id);
            return (
              <Pressable
                style={[styles.card, on && styles.cardOn]}
                onPress={() =>
                  setSelected((p) =>
                    p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id],
                  )
                }
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>@{item.slug}</Text>
              </Pressable>
            );
          }}
        />
      )}

      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      <Pressable
        style={[styles.btn, (!canFinish && orbits.length > 0) || loading || fetching ? styles.btnOff : null]}
        onPress={finish}
        disabled={(!canFinish && orbits.length > 0) || loading || fetching}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>
            {required === 0 ? "Devam et" : `Devam et (${selected.length}/${required})`}
          </Text>
        )}
      </Pressable>

      <Pressable style={[styles.btnOutline, loading && styles.btnOff]} onPress={skip} disabled={loading}>
        <Text style={styles.btnOutlineText}>
          {loading ? "Kaydediliyor…" : "Atla — şimdilik geç"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  title: { color: OrblyColors.textPrimary, fontSize: 22, fontWeight: "700", flex: 1 },
  skip: { color: OrblyColors.textSecondary, fontSize: 15, fontWeight: "600", paddingTop: 4 },
  hint: { color: OrblyColors.textSecondary, fontSize: 15, marginBottom: 16 },
  loader: { marginVertical: 24 },
  center: { alignItems: "center", paddingVertical: 24, gap: 12 },
  error: { color: OrblyColors.like, fontSize: 14, marginBottom: 8 },
  retry: { color: OrblyColors.accent, fontWeight: "600" },
  empty: { color: OrblyColors.textSecondary, textAlign: "center", padding: 24 },
  row: { gap: 8 },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    marginBottom: 8,
  },
  cardOn: { borderColor: OrblyColors.orbit, backgroundColor: "rgba(120,86,255,0.15)" },
  cardTitle: { color: OrblyColors.textPrimary, fontWeight: "700" },
  cardSub: { color: OrblyColors.textSecondary, fontSize: 13 },
  btn: {
    backgroundColor: OrblyColors.textPrimary,
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnOff: { opacity: 0.4 },
  btnText: { color: "#000", fontWeight: "700" },
  btnOutline: {
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  btnOutlineText: { color: OrblyColors.textPrimary, fontWeight: "700" },
});
