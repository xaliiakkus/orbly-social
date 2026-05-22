"use client";

import { Check } from "lucide-react";

export function SettingsLanguagePanel() {
  return (
    <div className="flex-1 divide-y divide-border">
      <div className="px-4 py-4">
        <p className="text-[15px] text-text-secondary leading-5">
          Uygulama dili. Ek diller yakında eklenecek.
        </p>
      </div>
      <div className="flex items-center justify-between px-4 py-4 bg-bg-hover/50">
        <div>
          <p className="font-bold text-[15px]">Türkçe</p>
          <p className="text-text-secondary text-[15px]">Varsayılan dil</p>
        </div>
        <Check className="h-5 w-5 text-accent" />
      </div>
      <div className="flex items-center justify-between px-4 py-4 opacity-50">
        <div>
          <p className="font-bold text-[15px]">English</p>
          <p className="text-text-secondary text-[15px]">Yakında</p>
        </div>
      </div>
    </div>
  );
}
