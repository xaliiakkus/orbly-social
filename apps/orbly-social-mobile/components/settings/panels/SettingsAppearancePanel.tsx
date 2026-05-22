import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { SettingsAutoSaveNote } from "@/components/settings/SettingsAutoSaveNote";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { OrblyColors } from "@/constants/Colors";
import { createSettingsAppearanceStyles } from "@/components/settings/settings-appearance-styles";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { useThemeStore } from "@/lib/theme-store";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { useThemedStyles } from "@/lib/use-themed-styles";

const PRESET_ACCENTS: Record<string, string> = {
  "orbly-dark": "#1d9bf0",
  ocean: "#0ea5e9",
  sunset: "#f97316",
  forest: "#22c55e",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  light: "#1d9bf0",
};

export function SettingsAppearancePanel() {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  const reduceMotion = useThemeStore((s) => s.reduceMotion);
  const setPresetId = useThemeStore((s) => s.setPresetId);
  const setAccentOverride = useThemeStore((s) => s.setAccentOverride);
  const setReduceMotion = useThemeStore((s) => s.setReduceMotion);
  const resetTheme = useThemeStore((s) => s.resetTheme);
  const styles = useThemedStyles(createSettingsAppearanceStyles);
  const [hexDraft, setHexDraft] = useState(accentOverride ?? "");

  useEffect(() => {
    setHexDraft(accentOverride ?? "");
  }, [accentOverride]);

  const { schedule: scheduleAccent } = useDebouncedCallback((hex: unknown) => {
    const trimmed = String(hex).trim();
    if (!trimmed) {
      setAccentOverride(null);
      return;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) setAccentOverride(trimmed);
  }, 450);

  return (
    <ScrollView style={styles.flex}>
      <SettingsAutoSaveNote />
      <Text style={styles.hint}>
        Renk paletini seç veya hex ile vurgu rengini özelleştir. Tercihin anında kaydedilir.
      </Text>

      <Text style={styles.sectionTitle}>Tema</Text>
      <View style={styles.grid}>
        {THEME_PRESETS.map((preset) => {
          const active = presetId === preset.id && !accentOverride;
          return (
            <Pressable
              key={preset.id}
              style={[
                styles.card,
                { backgroundColor: preset.colors.bgPrimary },
                active && styles.cardActive,
              ]}
              onPress={() => setPresetId(preset.id)}
            >
              <View style={[styles.swatch, { backgroundColor: preset.colors.accent }]} />
              <Text style={[styles.cardTitle, { color: preset.colors.textPrimary }]}>
                {preset.name}
              </Text>
              {active ? (
                <FontAwesome
                  name="check-circle"
                  size={16}
                  color={preset.colors.accent}
                  style={styles.check}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Özel vurgu rengi</Text>
      <View style={styles.hexRow}>
        <TextInput
          style={styles.hexInput}
          value={hexDraft}
          onChangeText={(v) => {
            setHexDraft(v);
            const trimmed = v.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
              setAccentOverride(trimmed);
              return;
            }
            scheduleAccent(v);
          }}
          placeholder={PRESET_ACCENTS[presetId] ?? "#1d9bf0"}
          placeholderTextColor={OrblyColors.textSecondary}
          autoCapitalize="none"
        />
        {accentOverride ? (
          <Pressable onPress={() => setAccentOverride(null)}>
            <Text style={styles.resetLink}>Sıfırla</Text>
          </Pressable>
        ) : null}
      </View>

      <SettingsToggle
        label="Azaltılmış hareket"
        description="Animasyonları azalt (yakında tam destek)"
        checked={reduceMotion}
        onChange={setReduceMotion}
      />

      <Pressable style={styles.resetBtn} onPress={resetTheme}>
        <FontAwesome name="refresh" size={14} color={OrblyColors.textSecondary} />
        <Text style={styles.resetText}>Varsayılana dön</Text>
      </Pressable>
    </ScrollView>
  );
}
