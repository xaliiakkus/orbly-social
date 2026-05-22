import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  Crown,
  Palette,
  Sparkles,
  Wallet,
} from "lucide-react";

export type SettingsSectionId =
  | "account"
  | "appearance"
  | "monetization"
  | "premium"
  | "creator"
  | "security"
  | "privacy"
  | "notifications"
  | "accessibility"
  | "language"
  | "orbits";

/** Özel panel bileşeni olan bölümler (liste yerine) */
export const SETTINGS_CUSTOM_PANELS = new Set<SettingsSectionId>([
  "account",
  "appearance",
  "privacy",
  "notifications",
  "security",
  "language",
]);

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  available?: boolean;
}

export interface SettingsDetailItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  available?: boolean;
  href?: string;
  action?: "edit-profile" | "logout" | "mark-notifications-read";
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { id: "account", label: "Hesabın", available: true },
  { id: "appearance", label: "Görünüm ve renk", available: true },
  { id: "notifications", label: "Bildirimler", available: true },
  { id: "privacy", label: "Gizlilik ve güvenlik", available: true },
  { id: "security", label: "Güvenlik ve hesap erişimi", available: true },
  { id: "orbits", label: "Orbit'ler", available: true },
  { id: "language", label: "Dil", available: true },
  { id: "accessibility", label: "Erişilebilirlik", available: true },
  { id: "monetization", label: "Para kazanma", available: false },
  { id: "premium", label: "Premium", available: false },
  { id: "creator", label: "Oluşturucu Abonelikleri", available: false },
];

export const SECTION_META: Record<
  SettingsSectionId,
  { title: string; description: string; items: SettingsDetailItem[] }
> = {
  account: {
    title: "Hesabın",
    description:
      "Hesap bilgilerini görüntüle, hesabınla ilgili değişiklikleri yap ve hesap durumun hakkında bilgi al.",
    items: [],
  },
  appearance: {
    title: "Görünüm ve renk",
    description: "Tema paleti ve vurgu rengi ile arayüzü kişiselleştir.",
    items: [],
  },
  monetization: {
    title: "Para kazanma",
    description: "Orbly üzerinden gelir elde etme seçenekleri yakında burada olacak.",
    items: [],
  },
  premium: {
    title: "Premium",
    description: "Premium abonelik ve özellikler yakında.",
    items: [],
  },
  creator: {
    title: "Oluşturucu Abonelikleri",
    description: "Abonelik paketlerini yönetmek için yakında.",
    items: [],
  },
  security: {
    title: "Güvenlik ve hesap erişimi",
    description: "Hesabının güvenliğini ve giriş yöntemlerini yönet.",
    items: [],
  },
  privacy: {
    title: "Gizlilik ve güvenlik",
    description: "Kimlerin seni görebileceğini ve etkileşim kurabileceğini kontrol et.",
    items: [],
  },
  notifications: {
    title: "Bildirimler",
    description: "Hangi bildirimleri alacağını seç.",
    items: [],
  },
  accessibility: {
    title: "Erişilebilirlik",
    description: "Görüntü ve etkileşim tercihlerini özelleştir.",
    items: [
      {
        id: "appearance-link",
        icon: Palette,
        title: "Görünüm ve renk",
        description: "Tema ve vurgu rengi ayarları",
        available: true,
        href: "/settings?section=appearance",
      },
    ],
  },
  language: {
    title: "Dil",
    description: "Uygulama dilini değiştir.",
    items: [],
  },
  orbits: {
    title: "Orbit'ler",
    description: "Katıldığın toplulukları keşfet ve yönet.",
    items: [
      {
        id: "orbits-list",
        icon: Sparkles,
        title: "Orbit'leri keşfet",
        description: "Topluluklara katıl veya ayrıl",
        available: true,
        href: "/orbits",
      },
    ],
  },
};

export const COMING_SOON_ICONS = {
  monetization: CircleDollarSign,
  premium: Crown,
  creator: Wallet,
} as const;
