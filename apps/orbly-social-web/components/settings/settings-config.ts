import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Bell,
  CircleDollarSign,
  Crown,
  Database,
  Eye,
  Globe,
  KeyRound,
  Lock,
  Shield,
  Sparkles,
  User,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";

export type SettingsSectionId =
  | "account"
  | "monetization"
  | "premium"
  | "creator"
  | "security"
  | "privacy"
  | "notifications"
  | "accessibility"
  | "language"
  | "orbits";

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
  { id: "monetization", label: "Para kazanma", available: false },
  { id: "premium", label: "Premium", available: false },
  { id: "creator", label: "Oluşturucu Abonelikleri", available: false },
  { id: "security", label: "Güvenlik ve hesap erişimi", available: false },
  { id: "privacy", label: "Gizlilik ve güvenlik", available: false },
  { id: "notifications", label: "Bildirimler", available: true },
  { id: "accessibility", label: "Erişilebilirlik", available: false },
  { id: "language", label: "Dil", available: false },
  { id: "orbits", label: "Orbit'ler", available: true },
];

export const SECTION_META: Record<
  SettingsSectionId,
  { title: string; description: string; items: SettingsDetailItem[] }
> = {
  account: {
    title: "Hesabın",
    description:
      "Hesap bilgilerini görüntüle, hesabınla ilgili değişiklikleri yap ve hesap durumun hakkında bilgi al.",
    items: [
      {
        id: "account-info",
        icon: UserCircle,
        title: "Hesap bilgileri",
        description: "Telefon, e-posta, kullanıcı adı",
        available: true,
        action: "edit-profile",
      },
      {
        id: "password",
        icon: KeyRound,
        title: "Şifreni değiştir",
        description: "İstediğin zaman değiştirebilirsin",
        available: false,
      },
      {
        id: "download",
        icon: Database,
        title: "Verilerini indir",
        description: "Hesabındaki bilgilerin bir arşivini indir",
        available: false,
      },
      {
        id: "deactivate",
        icon: User,
        title: "Hesabını devre dışı bırak",
        description: "Hesabını yeniden etkinleştirmek için ne yapman gerektiğini öğren",
        available: false,
      },
    ],
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
    items: [
      {
        id: "2fa",
        icon: Shield,
        title: "İki faktörlü kimlik doğrulama",
        description: "Ekstra güvenlik katmanı",
        available: false,
      },
      {
        id: "sessions",
        icon: Lock,
        title: "Uygulama ve oturumlar",
        description: "Bağlı cihazları görüntüle",
        available: false,
      },
    ],
  },
  privacy: {
    title: "Gizlilik ve güvenlik",
    description: "Kimlerin seni görebileceğini ve etkileşim kurabileceğini kontrol et.",
    items: [
      {
        id: "audience",
        icon: Eye,
        title: "Hedef kitle ve etiketleme",
        description: "Kimlerin içeriklerini görebileceğini yönet",
        available: false,
      },
      {
        id: "mute",
        icon: Users,
        title: "Sessize alınan ve engellenen",
        description: "Engellediğin hesapları yönet",
        available: false,
      },
    ],
  },
  notifications: {
    title: "Bildirimler",
    description: "Hangi bildirimleri alacağını seç.",
    items: [
      {
        id: "mark-all-read",
        icon: Bell,
        title: "Tümünü okundu işaretle",
        description: "Okunmamış bildirimleri temizle",
        available: true,
        action: "mark-notifications-read",
      },
      {
        id: "notif-feed",
        icon: Bell,
        title: "Bildirim akışı",
        description: "Tüm bildirimleri görüntüle",
        available: true,
        href: "/notifications",
      },
    ],
  },
  accessibility: {
    title: "Erişilebilirlik",
    description: "Görüntü ve etkileşim tercihlerini özelleştir.",
    items: [
      {
        id: "a11y",
        icon: Accessibility,
        title: "Erişilebilirlik görüntüleme",
        description: "Kontrast ve hareket ayarları",
        available: false,
      },
    ],
  },
  language: {
    title: "Dil",
    description: "Uygulama dilini değiştir.",
    items: [
      {
        id: "lang",
        icon: Globe,
        title: "Uygulama dili",
        description: "Türkçe",
        available: false,
      },
    ],
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
