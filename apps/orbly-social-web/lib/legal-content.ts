/** Orbly — yasal metinler (TR). Son güncelleme tarihini güncel tutun. */

export const LEGAL_META = {
  lastUpdated: "19 Mayıs 2026",
  productName: "Orbly",
  controllerName: "Orbly",
  contactEmail: "info@orbly.social",
  website: "https://orbly.social",
} as const;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_POLICY_INTRO =
  "Bu Gizlilik Politikası, Orbly mobil uygulaması ve web sitesi (“Platform”) üzerinden sunulan hizmetler kapsamında kişisel verilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklar.";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "1. Kapsam",
    paragraphs: [
      "Politika; hesap oluşturma, giriş, profil, gönderi, mesajlaşma, bildirim, canlı yayın ve benzeri tüm Platform özellikleri için geçerlidir.",
      "Platformu kullanarak bu politikayı okuduğunuzu ve anladığınızı kabul etmiş sayılırsınız. Okumak istemiyorsanız hizmeti kullanmamanız gerekir.",
    ],
  },
  {
    id: "controller",
    title: "2. Veri sorumlusu",
    paragraphs: [
      `Kişisel verilerinizin veri sorumlusu ${LEGAL_META.controllerName}’dir. Gizlilik ile ilgili talepleriniz için: ${LEGAL_META.contactEmail}.`,
    ],
  },
  {
    id: "data-collected",
    title: "3. Toplanan veriler",
    paragraphs: ["Platformda aşağıdaki veri kategorileri işlenebilir:"],
    bullets: [
      "Kimlik ve hesap: kullanıcı adı, görünen ad, e-posta, şifre (yalnızca hash’lenmiş), profil fotoğrafı ve biyografi.",
      "İçerik: gönderiler, yanıtlar, beğeniler, yer imleri, mesajlar, canlı yayın meta verileri ve medya dosyaları.",
      "Kullanım: oturum bilgileri, cihaz türü, uygulama sürümü, hata kayıtları ve güvenlik günlükleri.",
      "İletişim: destek talepleri ve bildirim tercihleri.",
      "Üçüncü taraf giriş: Google veya Apple ile oturum açtığınızda sağlayıcının paylaştığı kimlik bilgileri (e-posta, ad vb.).",
    ],
  },
  {
    id: "purposes",
    title: "4. Kullanım amaçları",
    paragraphs: ["Verileriniz şu amaçlarla işlenir:"],
    bullets: [
      "Hesap oluşturma, kimlik doğrulama ve oturum yönetimi.",
      "Sosyal özelliklerin sunulması (feed, takip, bildirim, mesajlaşma).",
      "Güvenlik, kötüye kullanımın önlenmesi ve hizmet sürekliliği.",
      "Yasal yükümlülüklerin yerine getirilmesi.",
      "Açık rızanız veya meşru menfaat kapsamında ürün iyileştirmesi ve destek.",
    ],
  },
  {
    id: "legal-basis",
    title: "5. Hukuki dayanak",
    paragraphs: [
      "KVKK kapsamında kişisel verileriniz; sözleşmenin kurulması veya ifası, hukuki yükümlülük, meşru menfaat ve gerektiğinde açık rızanız hukuki sebeplerine dayanılarak işlenir.",
    ],
  },
  {
    id: "sharing",
    title: "6. Paylaşım ve aktarım",
    paragraphs: [
      "Verileriniz; barındırma (ör. bulut altyapısı), e-posta gönderimi, kimlik doğrulama (OAuth) ve analitik hizmet sağlayıcılarıyla yalnızca hizmetin sunulması için gerekli ölçüde paylaşılabilir.",
      "Yurt dışına aktarım söz konusuysa KVKK md. 9’a uygun güvenceler (açık rıza, yeterlilik kararı veya taahhütname) sağlanır.",
      "Yasal zorunluluk halinde yetkili kurumlarla paylaşım yapılabilir.",
    ],
  },
  {
    id: "retention",
    title: "7. Saklama süresi",
    paragraphs: [
      "Hesabınız aktif olduğu sürece verileriniz saklanır. Hesap silme talebinizde, yasal saklama zorunlulukları hariç, makul süre içinde silinir veya anonimleştirilir.",
      "Güvenlik ve denetim kayıtları, yasal süreler boyunca tutulabilir.",
    ],
  },
  {
    id: "security",
    title: "8. Güvenlik",
    paragraphs: [
      "Verilerinizi korumak için şifreleme, erişim kontrolü, güvenli iletişim (HTTPS/TLS) ve düzenli güvenlik değerlendirmeleri uygulanır. Hiçbir sistem %100 güvenli değildir; riskleri makul ölçüde azaltmaya çalışırız.",
    ],
  },
  {
    id: "rights",
    title: "9. Haklarınız",
    paragraphs: [
      "KVKK md. 11 kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.",
      `Taleplerinizi ${LEGAL_META.contactEmail} adresine iletebilirsiniz; kimliğinizi doğrulamamız gerekebilir.`,
    ],
  },
  {
    id: "children",
    title: "10. Çocuklar",
    paragraphs: [
      "Platform 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaş altından veri toplamıyoruz. Böyle bir durum fark edilirse hesap kapatılır ve veriler silinir.",
    ],
  },
  {
    id: "changes",
    title: "11. Değişiklikler",
    paragraphs: [
      "Bu politika güncellenebilir. Önemli değişiklikler Platform üzerinden veya e-posta ile duyurulabilir. Güncelleme tarihi sayfa başında yer alır.",
    ],
  },
];

export const KVKK_INTRO =
  "6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, Orbly olarak kişisel verilerinizin işlenmesine ilişkin sizi bilgilendiriyoruz. Bu metin, KVKK md. 10 kapsamındaki aydınlatma yükümlülüğümüzü yerine getirmek içindir.";

export const KVKK_SECTIONS: LegalSection[] = [
  {
    id: "controller",
    title: "1. Veri sorumlusu",
    paragraphs: [
      `Veri sorumlusu: ${LEGAL_META.controllerName}`,
      `İletişim: ${LEGAL_META.contactEmail} · ${LEGAL_META.website}`,
    ],
  },
  {
    id: "processed",
    title: "2. İşlenen kişisel veri kategorileri",
    bullets: [
      "Kimlik (ad, kullanıcı adı), iletişim (e-posta), dijital kimlik (IP, cihaz tanımlayıcıları, oturum çerezleri/token’ları).",
      "Görsel ve işitsel kayıtlar (profil ve paylaşım medyası).",
      "İşlem güvenliği (giriş kayıtları, şüpheli aktivite verileri).",
      "Pazarlama ve tercih (bildirim ayarları — yalnızca açık rıza veya ayarlarınızla).",
      "Kullanıcı içeriği ve sosyal ağ etkileşim verileri.",
    ],
    paragraphs: [],
  },
  {
    id: "purposes",
    title: "3. İşleme amaçları",
    bullets: [
      "Üyelik ve sözleşmesel hizmetlerin yürütülmesi.",
      "Bilgi güvenliği süreçlerinin yürütülmesi.",
      "Kullanıcı ilişkileri yönetimi ve destek taleplerinin yanıtlanması.",
      "Mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi.",
      "İstatistik ve hizmet kalitesinin artırılması (anonimleştirilmiş veya meşru menfaat çerçevesinde).",
    ],
    paragraphs: [],
  },
  {
    id: "legal-reasons",
    title: "4. Hukuki sebepler",
    paragraphs: [
      "Kişisel verileriniz; KVKK md. 5/2 (sözleşme, hukuki yükümlülük, veri sorumlusunun hukuki menfaati) ve md. 6 (açık rıza gerektiren hallerde açık rızanız) kapsamında işlenmektedir.",
    ],
  },
  {
    id: "transfer",
    title: "5. Aktarım",
    paragraphs: [
      "Verileriniz; sunucu barındırma, e-posta, OAuth sağlayıcıları ve teknik altyapı ortaklarına, hizmetin ifası için gerekli olduğu ölçüde aktarılabilir.",
      "Yurt dışına aktarımda KVKK md. 9 hükümlerine uyulur; gerekli hallerde açık rızanız alınır veya Kurulca belirlenen güvenceler uygulanır.",
    ],
  },
  {
    id: "collection",
    title: "6. Toplama yöntemi",
    paragraphs: [
      "Veriler; Platform formları, otomatik loglar, çerezler/benzeri teknolojiler ve üçüncü taraf kimlik doğrulama hizmetleri aracılığıyla elektronik ortamda toplanır.",
    ],
  },
  {
    id: "rights-kvkk",
    title: "7. KVKK md. 11 hakları",
    paragraphs: ["Kanun kapsamında aşağıdaki haklara sahipsiniz:"],
    bullets: [
      "Kişisel verilerinizin işlenip işlenmediğini öğrenme.",
      "İşlenmişse buna ilişkin bilgi talep etme.",
      "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.",
      "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.",
      "Eksik veya yanlış işlenmişse düzeltilmesini isteme.",
      "KVKK md. 7 kapsamında silinmesini veya yok edilmesini isteme.",
      "Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme.",
      "Otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.",
      "Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme.",
    ],
  },
  {
    id: "application",
    title: "8. Başvuru yolu",
    paragraphs: [
      `Haklarınızı kullanmak için ${LEGAL_META.contactEmail} adresine kimliğinizi doğrulayıcı bilgilerle başvurabilirsiniz.`,
      "Başvurular, talebin niteliğine göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi halinde Kurul tarifesindeki ücret alınabilir.",
      "Red halinde Kişisel Verileri Koruma Kurulu’na şikâyet hakkınız saklıdır.",
    ],
  },
  {
    id: "obligation",
    title: "9. Aydınlatma yükümlülüğü",
    paragraphs: [
      "Kayıt veya giriş sırasında Gizlilik Politikası ve bu aydınlatma metnine erişim sunulmaktadır. Metinleri okumadan da hizmeti kullanabilirsiniz; ancak kullanım, ilgili sözleşme ve mevzuat hükümlerinin kabulü anlamına gelir.",
    ],
  },
];
