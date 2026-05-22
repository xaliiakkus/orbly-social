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

export const SECTION_META: Record<SettingsSectionId, { title: string; description: string }> =
  {
    account: {
      title: "Hesabın",
      description:
        "Hesap bilgilerini görüntüle, hesabınla ilgili değişiklikleri yap ve hesap durumun hakkında bilgi al.",
    },
    appearance: {
      title: "Görünüm ve renk",
      description: "Tema paleti ve vurgu rengi ile arayüzü kişiselleştir.",
    },
    monetization: {
      title: "Para kazanma",
      description: "Orbly üzerinden gelir elde etme seçenekleri yakında burada olacak.",
    },
    premium: {
      title: "Premium",
      description: "Premium abonelik ve özellikler yakında.",
    },
    creator: {
      title: "Oluşturucu Abonelikleri",
      description: "Abonelik paketlerini yönetmek için yakında.",
    },
    security: {
      title: "Güvenlik ve hesap erişimi",
      description: "Hesabının güvenliğini ve giriş yöntemlerini yönet.",
    },
    privacy: {
      title: "Gizlilik ve güvenlik",
      description: "Kimlerin seni görebileceğini ve etkileşim kurabileceğini kontrol et.",
    },
    notifications: {
      title: "Bildirimler",
      description: "Hangi bildirimleri alacağını seç.",
    },
    accessibility: {
      title: "Erişilebilirlik",
      description: "Görünüm ayarlarına git.",
    },
    language: {
      title: "Dil",
      description: "Uygulama dilini değiştir.",
    },
    orbits: {
      title: "Orbit'ler",
      description: "Katıldığın toplulukları keşfet ve yönet.",
    },
  };
