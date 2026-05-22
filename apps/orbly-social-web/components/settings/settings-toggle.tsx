"use client";

import { cn } from "@/lib/cn";

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-4 w-full cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[15px] leading-5">{label}</p>
        {description ? (
          <p className="text-text-secondary text-[15px] leading-5">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-bg-tertiary border border-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}
