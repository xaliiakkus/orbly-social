import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationPrefKey =
  | "likes"
  | "replies"
  | "reposts"
  | "follows"
  | "mentions"
  | "orbits";

type Prefs = Record<NotificationPrefKey, boolean>;

const DEFAULTS: Prefs = {
  likes: true,
  replies: true,
  reposts: true,
  follows: true,
  mentions: true,
  orbits: true,
};

interface NotificationPrefsState extends Prefs {
  setPref: (key: NotificationPrefKey, enabled: boolean) => void;
  setAll: (enabled: boolean) => void;
}

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setPref: (key, enabled) => set({ [key]: enabled }),
      setAll: (enabled) => set({ ...DEFAULTS, ...Object.fromEntries(
        Object.keys(DEFAULTS).map((k) => [k, enabled]),
      ) as Prefs }),
    }),
    { name: "orbly-notification-prefs-v1" },
  ),
);

export const NOTIFICATION_PREF_LABELS: Record<
  NotificationPrefKey,
  { title: string; description: string }
> = {
  likes: { title: "Beğeniler", description: "Gönderilerin beğenildiğinde" },
  replies: { title: "Yanıtlar", description: "Gönderine yanıt geldiğinde" },
  reposts: { title: "Yeniden paylaşımlar", description: "Gönderin paylaşıldığında" },
  follows: { title: "Takipçiler", description: "Biri seni takip ettiğinde" },
  mentions: { title: "Bahsetmeler", description: "Senden bahsedildiğinde" },
  orbits: { title: "Orbit", description: "Topluluk davetleri ve güncellemeler" },
};
