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
        title: "Hesap bilgileri",
        description: "Telefon, e-posta, kullanıcı adı",
        available: true,
        action: "edit-profile",
      },
      {
        id: "bookmarks",
        title: "Yer imleri",
        description: "Kaydettiğin gönderiler",
        available: true,
        href: "/bookmarks",
      },
      {
        id: "password",
        title: "Şifreni değiştir",
        description: "İstediğin zaman değiştirebilirsin",
        available: false,
      },
      {
        id: "download",
        title: "Verilerini indir",
        description: "Hesabındaki bilgilerin bir arşivini indir",
        available: false,
      },
      {
        id: "deactivate",
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
        title: "İki faktörlü kimlik doğrulama",
        description: "Ekstra güvenlik katmanı",
        available: false,
      },
      {
        id: "sessions",
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
        title: "Hedef kitle ve etiketleme",
        description: "Kimlerin içeriklerini görebileceğini yönet",
        available: false,
      },
      {
        id: "mute",
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
        title: "Tümünü okundu işaretle",
        description: "Okunmamış bildirimleri temizle",
        available: true,
        action: "mark-notifications-read",
      },
      {
        id: "notif-feed",
        title: "Bildirim akışı",
        description: "Tüm bildirimleri görüntüle",
        available: true,
        href: "/(tabs)/notifications",
      },
    ],
  },
  accessibility: {
    title: "Erişilebilirlik",
    description: "Görüntü ve etkileşim tercihlerini özelleştir.",
    items: [
      {
        id: "a11y",
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
        title: "Orbit'leri keşfet",
        description: "Topluluklara katıl veya ayrıl",
        available: true,
        href: "/orbits",
      },
    ],
  },
};
