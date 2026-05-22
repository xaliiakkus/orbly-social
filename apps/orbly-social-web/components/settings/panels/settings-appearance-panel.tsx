"use client";

import { Check, RotateCcw } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { SettingsAutoSaveNote } from "@/components/settings/settings-auto-save-note";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { useThemeStore } from "@/lib/theme-store";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { cn } from "@/lib/cn";

export function SettingsAppearancePanel() {
  const presetId = useThemeStore((s) => s.presetId);
  const accentOverride = useThemeStore((s) => s.accentOverride);
  const reduceMotion = useThemeStore((s) => s.reduceMotion);
  const setPresetId = useThemeStore((s) => s.setPresetId);
  const setAccentOverride = useThemeStore((s) => s.setAccentOverride);
  const setReduceMotion = useThemeStore((s) => s.setReduceMotion);
  const resetTheme = useThemeStore((s) => s.resetTheme);
  const accentInputId = useId();
  const [hexDraft, setHexDraft] = useState(accentOverride ?? "");

  useEffect(() => {
    setHexDraft(accentOverride ?? "");
  }, [accentOverride]);

  const { schedule: scheduleAccentSave } = useDebouncedCallback((hex: string) => {
    const trimmed = hex.trim();
    if (!trimmed) {
      setAccentOverride(null);
      return;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      setAccentOverride(trimmed);
    }
  }, 450);

  return (
    <div className="flex-1 divide-y divide-border">
      <SettingsAutoSaveNote />
      <div className="px-4 py-4">
        <p className="text-[15px] text-text-secondary leading-5">
          Renk paletini seç veya vurgu rengini özelleştir. Tercihin anında bu cihazda saklanır.
        </p>
      </div>

      <div className="px-4 py-4">
        <p className="text-[13px] font-bold uppercase tracking-wide text-text-secondary mb-3">
          Tema
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const active = presetId === preset.id && !accentOverride;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPresetId(preset.id)}
                className={cn(
                  "relative rounded-2xl border p-3 text-left transition-all hover:scale-[1.02]",
                  active ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-text-tertiary",
                )}
                style={{
                  background: preset.vars["--color-bg-primary"],
                  color: preset.vars["--color-text-primary"],
                }}
              >
                <span
                  className="mb-2 block h-8 w-8 rounded-full border border-white/20"
                  style={{ background: preset.vars["--color-accent"] }}
                />
                <span className="block text-[14px] font-bold">{preset.name}</span>
                <span
                  className="block text-[12px] opacity-70 mt-0.5 line-clamp-2"
                  style={{ color: preset.vars["--color-text-secondary"] }}
                >
                  {preset.description}
                </span>
                {active ? (
                  <Check className="absolute top-2 right-2 h-4 w-4 text-accent" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <label htmlFor={accentInputId} className="text-[13px] font-bold uppercase tracking-wide text-text-secondary">
          Özel vurgu rengi
        </label>
        <div className="flex items-center gap-3">
          <input
            id={accentInputId}
            type="color"
            value={accentOverride ?? (hexDraft || "#1d9bf0")}
            onChange={(e) => {
              setHexDraft(e.target.value);
              setAccentOverride(e.target.value);
            }}
            className="h-12 w-14 rounded-xl border border-border bg-bg-secondary cursor-pointer"
          />
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => {
              setHexDraft(e.target.value);
              scheduleAccentSave(e.target.value);
            }}
            placeholder="#1d9bf0"
            className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-[15px] outline-none focus:border-accent font-mono"
          />
          {accentOverride ? (
            <button
              type="button"
              onClick={() => setAccentOverride(null)}
              className="text-[14px] font-bold text-accent hover:underline shrink-0"
            >
              Sıfırla
            </button>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-border">
        <SettingsToggle
          label="Azaltılmış hareket"
          description="Animasyonları ve geçişleri azalt"
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={resetTheme}
          className="inline-flex items-center gap-2 text-[15px] font-bold text-text-secondary hover:text-text-primary"
        >
          <RotateCcw className="h-4 w-4" />
          Varsayılana dön
        </button>
      </div>
    </div>
  );
}
