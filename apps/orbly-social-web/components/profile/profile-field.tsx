"use client";

import { cn } from "@/lib/cn";

export function ProfileField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  maxLength,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  const shared =
    "w-full bg-transparent text-[17px] text-text-primary outline-none placeholder:text-text-tertiary pt-4 pb-2 px-3 min-h-[24px]";

  return (
    <label className="block rounded border border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-colors">
      <span className="block px-3 pt-2 text-[13px] text-text-secondary leading-none">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          className={cn(shared, "resize-none min-h-[100px]")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={shared}
        />
      )}
    </label>
  );
}
