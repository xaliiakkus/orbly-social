"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SettingsAutoSaveNote } from "@/components/settings/settings-auto-save-note";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import {
  NOTIFICATION_PREF_LABELS,
  useNotificationPrefsStore,
  type NotificationPrefKey,
} from "@/lib/notification-prefs-store";
import { useReadAllNotifications } from "@orbly/features";

const PREF_KEYS = Object.keys(NOTIFICATION_PREF_LABELS) as NotificationPrefKey[];

export function SettingsNotificationsPanel() {
  const prefs = useNotificationPrefsStore();
  const readAll = useReadAllNotifications();

  return (
    <div className="flex-1 divide-y divide-border">
      <SettingsAutoSaveNote />
      <div className="px-4 py-4">
        <p className="text-[15px] text-text-secondary leading-5">
          Hangi bildirim türlerini almak istediğini seç. Her değişiklik anında kaydedilir.
        </p>
      </div>

      {PREF_KEYS.map((key) => (
        <SettingsToggle
          key={key}
          label={NOTIFICATION_PREF_LABELS[key].title}
          description={NOTIFICATION_PREF_LABELS[key].description}
          checked={prefs[key]}
          onChange={(v) => prefs.setPref(key, v)}
        />
      ))}

      <button
        type="button"
        onClick={() => readAll.mutate()}
        disabled={readAll.isPending}
        className="flex items-start gap-4 px-4 py-4 w-full text-left hover:bg-bg-hover transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px]">Tümünü okundu işaretle</p>
          <p className="text-text-secondary text-[15px]">Okunmamış bildirimleri temizle</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
      </button>

      <Link
        href="/notifications"
        className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px]">Bildirim akışı</p>
          <p className="text-text-secondary text-[15px]">Tüm bildirimleri görüntüle</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
      </Link>
    </div>
  );
}
