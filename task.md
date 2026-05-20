# Orbly — görev durumu (X paritesi)

**Son güncelleme:** 2026-05-19  
Bu dosya **tamamlanan işleri** ve **X’te olup bizde henüz olmayanları** kaydeder. Aynı işi tekrar yaptırmamak için agent/kullanıcı önce buraya bakmalı.

> Uygulama yolları: `apps/orbly-social-web`, `apps/orbly-social-mobile`, `apps/orbly-social-api`  
> Paylaşılan mantık: her istemcinin kendi `packages/` kopyası (kök `packages/` import yok).

---

## Tamamlandı — tekrar yapma

Aşağıdaki maddeler **web + mobile + API** (veya ilgili katman) tarafında uygulanmış ve kablolanmış kabul edilir (ince ayar / bug fix hariç).

### Rewet (Repost) — X çekirdeği

| Madde | API | Web | Mobile | Not |
|-------|-----|-----|--------|-----|
| Basit yeniden paylaş (rewet) | `posts.repost` | `usePostRepost` + `RepostMenu` | Alert menü + `usePostRepost` | |
| Geri al (undo repost) | `posts.unrepost` | Menü “Yeniden paylaşımı geri al” | Alert | Soft-delete + sayaç |
| Alıntıla (quote) | `posts.repost` + `content` | `RepostComposeModal` + `ComposeBox.quoteRepostId` | `RepostComposeModal` | Metin zorunlu |
| Gömülü orijinal (`repostOf`) | `enrich_posts` | `RepostEmbed` | `RepostEmbed` | |
| “X yeniden paylaştı” başlığı | — | `post-card` | `PostCard` | |
| `repostedByMe` / `myRepostId` | `PostOut` | Tipler + cache | Aynı | |
| Rewet hedefi (repost-of-repost → kök) | `_repost_target` | `getRepostTargetPost` | Aynı | X davranışı |
| Kendi gönderini rewet engeli | API 400 | `ownPost` disable | Aynı | |
| Çift basit rewet engeli | API 400 “Already reposted” | — | — | |
| Rewet bildirimi | `_notify(..., "repost")` | Bildirim UI tipi var | Aynı | Gruplama kısmen |
| Önbellek güncelleme | — | `applyPostRepostToCache` | Aynı | Feed invalidate |
| Rewet edenler listesi (R1) | `GET /v1/posts/{id}/reposts` | `RepostersModal` | `RepostersModal` | Sayaça tıkla |
| Bağlantı kopyala (R3) | — | `getPostShareUrl` + menü | `Share` + menü | |

**İlgili dosyalar (referans):**

- API: `app/commands/posts_cmds.py`, `app/services/posts.py`, `app/services/serializers.py`, `app/schemas/common.py`
- Features (her iki app `packages/features/`): `posts/repost-target.ts`, `hooks/use-post-repost.ts`, `realtime/cache.ts` (`applyPostRepostToCache`)
- Web UI: `components/post/post-card.tsx`, `repost-menu.tsx`, `repost-embed.tsx`, `repost-compose-*`, `compose-box.tsx`
- Mobile UI: `components/PostCard.tsx`, `RepostEmbed.tsx`, `RepostComposeModal.tsx`, `lib/repost-compose-context.tsx`, `ComposeBox.tsx`

### Keşfet (Explore) — UI + sıralama algoritması

Takip etmese bile Mongo pipeline ile yüksek etkileşimli / çok yanıtlanan gönderiler keşfete düşer (X Heavy Ranker ağırlıklarına yakın heuristik).

| Madde | API | Web | Mobile | Not |
|-------|-----|-----|--------|-----|
| Keşfet UI (header, sekmeler, trend satırı, öne çıkan kart) | — | `explore-content.tsx`, `components/explore/*` | `app/(tabs)/explore.tsx`, `components/explore/*` | X benzeri sekmeler |
| Gönderi akışı `Sana Özel` / `Gündemdekiler` | `GET /v1/feed/explore` | `ExplorePostsFeed` + `useExploreFeed` | `ExplorePostsFeed` | Sonsuz scroll |
| Skorlama pipeline (takip şart değil) | `feed_ranking.py` | — | — | like 1, reply **5.5**, repost 3.5, bookmark 1.5, view 0.08 |
| `for-you` keşif (14 gün) | `build_explore_pipeline` | tab `for-you` | aynı | `discover_mode`, zaman çürümesi |
| `trending` gönderiler (48 saat, yanıt ağırlıklı) | `build_explore_trending_posts_pipeline` | tab `trending` | aynı | |
| Hashtag gündemi (48 saat, etkileşim ağırlıklı) | `build_trending_hashtags_pipeline` + `/feed/trending` | trend satırları | aynı | Redis cache varsa önce o |
| İstemci API | `feed.explore(tab, cursor)` | `packages/api-client` | aynı kopya | Her iki app |

**İlgili dosyalar:**

- API: `app/services/feed_ranking.py`, `app/routers/feed.py` (`/explore`, `/trending`)
- Features: `hooks/use-explore-feed.ts` (web + mobile `packages/features/`)
- Web: `components/explore/explore-posts-feed.tsx`
- Mobile: `components/explore/ExplorePostsFeed.tsx`

**Kaynak notu:** Ağırlıklar [twitter/the-algorithm](https://github.com/twitter/the-algorithm) recap’ine göre; yanıt (reply) en yüksek öncelik — “en çok tartışılan” gönderiler öne çıkar.

### Ana sayfa compose (X benzeri)

| Madde | Web | Mobile | Not |
|-------|-----|--------|-----|
| Ana sayfada inline compose | `home/page.tsx` + `ComposeBox` | Yok (bilinçli) | Web: modal yerine akış üstü |
| FAB → tam ekran compose | — | `ComposeFab` + `ComposeModal` | Native pattern |
| Mobile web FAB | `/home` hariç gizle | — | Keşfet vb. sayfalarda FAB kalır |

### Profil — responsive

| Madde | Web | Mobile | Not |
|-------|-----|--------|-----|
| Düzenle butonu banner altında (dar ekran) | `ProfileHeader` | `ProfileHeader` | Avatar/banner overlap düzeni |

### Oturum / API istemci

| Madde | Durum |
|-------|--------|
| `POST /v1/auth/refresh` | Tamam |
| 401’de token yenileme (web + mobile `api-client`) | Tamam |
| Web NextAuth + `session-sync` | Tamam |
| Mobile `AuthBootstrap` token sync | Tamam |
| Prod API HTTPS (`getApiBaseUrl`) | Tamam |

### Medya / profil görselleri

| Madde | Durum |
|-------|--------|
| Harici avatar/post URL (Next `_next/image` bypass) | Tamam (`MediaImage`, `media-url`) |
| Cloudinary sunucu yükleme (görsel) | Tamam |
| iDrive / video yolu | Tamam |

### Onboarding

| Madde | Durum |
|-------|--------|
| “Atla” (skip) | Tamam |

### Mesajlaşma (DM)

| Madde | Durum |
|-------|--------|
| Karşılıklı takip zorunluluğu (yeni konuşma / gönder) | Tamam (`follow_checks`) |
| `canMessage` / profil mesaj butonu | Tamam |
| Mesajda `sender` + sohbet balonu / avatar | Tamam (web `ChatMessage`, mobile chat) |
| Mobile klavye (`KeyboardAvoidingView`) | Tamam |

### Gönderi — rewet dışı (kısmen)

| Madde | Durum |
|-------|--------|
| Beğeni toggle + cache | Tamam |
| Yer imi | Tamam |
| Yanıt compose (modal / context) | Tamam |
| Anket (poll) oluşturma + oy | Tamam |
| Gönderi silme / düzenleme (sahip) | Tamam |
| Görüntülenme sayacı | Tamam |

### Derleme / lint düzeltmeleri (rewet + explore dönemi)

| Madde | Durum |
|-------|--------|
| `repost-menu.tsx` kullanılmayan import | Tamam |
| `session-sync` hook deps | Tamam |
| `repost-compose-modal` / `MobileFullComposeDrawer` props | Tamam |
| Explore `EmptyState` icon prop | Tamam |

---

## Rewet — X’te var, bizde henüz yok

Öncelik: kullanıcı rewet deneyiminde hissedilen farklar. **R1 ve R3 tamamlandı** (yukarıdaki tabloda); aşağıda kalanlar.

| # | X davranışı | Bizde | Önerilen iş |
|---|-------------|--------|-------------|
| R2 | Profilde **Rewetler** sekmesi (ayrı timeline) | Yok | Profil sekmesi + feed filtresi `repostOfId != null` |
| R4 | Alıntıda **medya / GIF / anket** | Sadece metin alıntısı | Ürün kararı; API `repost` medya kabul etmiyor |
| R5 | Alıntı gönderisini **düzenle** | Yok | `posts.update` + quote post kuralları |
| R6 | **Gerçek zamanlı** rewet sayacı (tüm istemciler) | Kısmen (`unrepost` broadcast; rewet sonrası çoğunlukla invalidate) | `broadcast_post_stats` rewet için de; socket dinleyicisi |
| R7 | Gizli hesap: rewet / alıntı kısıtları | Yok | `isPrivate` + takip kontrolü |
| R8 | Bildirimde rewet’e tıklayınca **doğrudan orijinal / alıntı** deep link | Genel post linki olabilir | `reply-target` benzeri `repost-target` |
| R9 | Rewet kartında etkileşimlerin tam X ayrımı (beğeni sayısı orijinale mi karta mı) | Kart `post.id` üzerinden like/reply | Dokümante et veya orijinal id’ye yönlendir |
| R10 | **Community / Premium** rewet özellikleri | Yok | Kapsam dışı (bilinçli) |

---

## Keşfet — X’te var, bizde henüz yok / kısmi

| # | X davranışı | Bizde | Önerilen iş |
|---|-------------|--------|-------------|
| E1 | **Haberler / Spor / Eğlence** sekmeleri (gerçek içerik) | Placeholder `EmptyState` | Kategori feed API + UI |
| E2 | Keşfet arama geçmişi, önerilen aramalar | Basit `api.search` | X tarzı arama UX |
| E3 | “Yeni gönderiler” banner (For You) | Yok | Change Streams / polling |
| E4 | ML / tam Heavy Ranker (öğrenilmiş model) | Mongo heuristik pipeline | Bilinçli MVP; ileride model |
| E5 | Keşfet **canlı** güncelleme (socket) | Pull + refetch | `broadcast` veya invalidate |
| E6 | **Deploy** — `/feed/explore` production’da | Kod hazır; `fly deploy` gerekebilir | API deploy doğrula |

---

## Genel ürün — X’te var, bizde büyük ölçüde yok

README faz listesinden; rewet / keşfet dışı tekrar planlamayı önlemek için özet. Detay: kök `README.md` “Yapılacaklar”.

| Alan | Örnek X özelliği | Bizde (kısa) |
|------|------------------|--------------|
| Keşfet / For You | Kişiselleştirilmiş feed, tartışılan gönderiler | **API + UI tamam** (heuristik); E1–E3 açık |
| Arama | Tam metin, kullanıcı, geçmiş | Kısmi API |
| Profil | Takipçi listesi, pinned post, rewet sekmesi (R2) | Temel profil + responsive header |
| Gönderi | URL önizleme, iç içe reply UI, paylaşım menüsü (rapor/embed) | Kısmi |
| DM | Grup, istek kutusu, okundu çift tik, medya | 1:1 + mutual follow |
| Bildirimler | Push (OneSignal), filtre sekmeleri | In-app liste; push yok |
| Ayarlar | Gizlilik, engelleme, sessize alma | Büyük ölçüde yok |
| Lists / Communities | Listeler, topluluklar | Yok |
| Spaces / Live | X Spaces | LiveKit tabanı var; parite ayrı |
| Premium / reklam / analytics | — | Yok |
| Moderasyon | Rapor et, gizle, safety | Yok |
| SEO / OG | Paylaşım kartları | Kısmi |

---

## Açık işler (sıradaki mantıklı adımlar)

1. **Deploy:** API (`/v1/feed/explore`, `/reposts`, refresh vb.) → `fly deploy` + smoke test.
2. **E6** — production’da keşfet gönderi akışını doğrula (boş liste = düşük etkileşim verisi normal).
3. **R2** — profil rewet sekmesi.
4. **R6** — socket ile rewet sayacı.
5. **E1** — Keşfet Haberler/Spor/Eğlence (şu an placeholder).
6. **R4–R5, R7–R9** — rewet tablosu (ürün/API kararı gerektirenler önce).

---

## Agent notu

- Yeni işe başlamadan **“Tamamlandı”**, **“Rewet — henüz yok”**, **“Keşfet — henüz yok”** bölümlerini kontrol et.
- Web/mobile parite: `packages/` değişikliği **her iki** `apps/orbly-social-*/packages/` kopyasında yapılmalı.
- Kullanıcı web yapısını kendisi yönetiyorsa; mobile/API işinde `apps/orbly-social-web` **açık istek olmadan** dokunma (`.cursor/rules/sync-web-mobile.mdc`).
- `MILESTONE.md` genel mimari özet; **görev takibi için `task.md` esas alınır.**
