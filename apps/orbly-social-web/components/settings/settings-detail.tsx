"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SettingsAccountPanel } from "@/components/settings/panels/settings-account-panel";
import { SettingsAppearancePanel } from "@/components/settings/panels/settings-appearance-panel";
import { SettingsLanguagePanel } from "@/components/settings/panels/settings-language-panel";
import { SettingsNotificationsPanel } from "@/components/settings/panels/settings-notifications-panel";
import { SettingsPrivacyPanel } from "@/components/settings/panels/settings-privacy-panel";
import { SettingsSecurityPanel } from "@/components/settings/panels/settings-security-panel";
import {
  SECTION_META,
  SETTINGS_CUSTOM_PANELS,
  type SettingsDetailItem,
  type SettingsSectionId,
} from "@/components/settings/settings-config";
import { useReadAllNotifications } from "@orbly/features";

import { cn } from "@/lib/cn";

function CustomPanel({
  sectionId,
  onEditProfile,
}: {
  sectionId: SettingsSectionId;
  onEditProfile: () => void;
}) {
  switch (sectionId) {
    case "account":
      return <SettingsAccountPanel onEditProfile={onEditProfile} />;
    case "appearance":
      return <SettingsAppearancePanel />;
    case "privacy":
      return <SettingsPrivacyPanel />;
    case "notifications":
      return <SettingsNotificationsPanel />;
    case "security":
      return <SettingsSecurityPanel />;
    case "language":
      return <SettingsLanguagePanel />;
    default:
      return null;
  }
}

export function SettingsDetail({
  sectionId,
  onEditProfile,
}: {
  sectionId: SettingsSectionId;
  onEditProfile: () => void;
}) {
  const router = useRouter();
  const meta = SECTION_META[sectionId];
  const readAllNotifications = useReadAllNotifications();
  const useCustom = SETTINGS_CUSTOM_PANELS.has(sectionId);

  const handleItem = (item: SettingsDetailItem) => {
    if (!item.available) return;
    if (item.action === "edit-profile") {
      onEditProfile();
      return;
    }
    if (item.action === "mark-notifications-read") {
      readAllNotifications.mutate();
      return;
    }
    if (item.href) {
      if (item.href.startsWith("/settings")) {
        router.push(item.href);
      } else {
        router.push(item.href);
      }
    }
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-53px)] md:min-h-screen">
      <header className="px-4 py-3 border-b border-border shrink-0 hidden md:block">
        <h2 className="text-[20px] font-extrabold leading-7">{meta.title}</h2>
        <p className="mt-2 text-[15px] text-text-secondary leading-5 max-w-xl">
          {meta.description}
        </p>
      </header>

      {useCustom ? (
        <CustomPanel sectionId={sectionId} onEditProfile={onEditProfile} />
      ) : meta.items.length > 0 ? (
        <div className="divide-y divide-border flex-1">
          {meta.items.map((item) => {
            const Icon = item.icon;
            const row = (
              <>
                <Icon className="h-6 w-6 shrink-0 text-text-primary" strokeWidth={1.75} />
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-[15px] leading-5">{item.title}</p>
                  <p className="text-text-secondary text-[15px] leading-5">{item.description}</p>
                </div>
                {item.available ? (
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
                ) : (
                  <span className="text-[13px] text-text-tertiary shrink-0">Yakında</span>
                )}
              </>
            );

            if (item.available && item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover transition-colors w-full text-left"
                >
                  {row}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.available}
                onClick={() => handleItem(item)}
                className={cn(
                  "flex items-start gap-4 px-4 py-4 w-full text-left transition-colors",
                  item.available ? "hover:bg-bg-hover cursor-pointer" : "opacity-60 cursor-default",
                )}
              >
                {row}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-8 text-text-secondary text-[15px]">Bu bölüm yakında kullanıma sunulacak.</p>
      )}
    </section>
  );
}
