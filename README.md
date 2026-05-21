# Orbly.social — Full-Stack Social Network

> X.com (Twitter) benzeri, niş topluluklara odaklanan sosyal ağ platformu.
> Domain: **orbly.social**
> Tasarım referansı: x.com — aynı renkler, font büyüklükleri ve genel iskelet.

---

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Mobile | Expo (React Native) |
| Styling | Tailwind CSS (X.com token sistemi) |
| **Backend API** | **Python 3.11+ · FastAPI · Uvicorn** (`apps/api`, port `4000`) |
| API ODM | Beanie + Motor (MongoDB async) |
| Veritabanı | MongoDB (yerel Docker / Atlas) |
| Şema referansı | `packages/db` (Mongoose 8 — legacy); canlı API modelleri `apps/api/app/models/` |
| Cache / Feed | Redis (Upstash) |
| Auth | NextAuth.js v5 (email + Google + Apple OAuth) + JWT |
| Medya Depolama | Cloudflare R2 |
| Arama | MongoDB Atlas Search (Lucene tabanlı, Algolia'ya gerek yok) |
| Kuyruk / Jobs | BullMQ + Redis |
| Realtime | MongoDB Change Streams → Socket.io |
| Push Bildirim | OneSignal |
| Deploy | Vercel (frontend) + Railway (backend servisler) |
| CI/CD | GitHub Actions |

---

## Dizin Yapısı

```
orbly/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── onboarding/
│   │   │   ├── (main)/
│   │   │   │   ├── home/
│   │   │   │   ├── explore/
│   │   │   │   ├── notifications/
│   │   │   │   ├── messages/
│   │   │   │   ├── orbits/
│   │   │   │   ├── bookmarks/
│   │   │   │   ├── profile/[username]/
│   │   │   │   └── settings/
│   │   │   ├── post/[id]/
│   │   │   └── api/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── post/
│   │   │   ├── feed/
│   │   │   ├── orbit/
│   │   │   ├── user/
│   │   │   └── ui/
│   │   │── lib/
├───│── └ packages/
│   │      ├── db/                   # Mongoose modelleri (legacy / referans)
│   │      ├── types/                # Ortak TypeScript tipleri (web/mobile)
│   │      └── config/               # Ortak env/config
│   ├── mobile/                  # ReactNative Mobile
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── onboarding/
│   │   │   ├── (main)/
│   │   │   │   ├── home/
│   │   │   │   ├── explore/
│   │   │   │   ├── notifications/
│   │   │   │   ├── messages/
│   │   │   │   ├── orbits/
│   │   │   │   ├── bookmarks/
│   │   │   │   ├── profile/[username]/
│   │   │   │   └── settings/
│   │   │   ├── post/[id]/
│   │   │   └── api/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── post/
│   │   │   ├── feed/
│   │   │   ├── orbit/
│   │   │   ├── user/
│   │   │   └── ui/
│   │   │── lib/
├───│───│── packages/
│   │        ├── db/                   # Mongoose modelleri (legacy / referans)
│   │        ├── types/                # Ortak TypeScript tipleri (web/mobile)
│   │        └── config/               # Ortak env/config
│   └── api/                  # Python FastAPI (ayrı servis, :4000)
│       ├── app/
│       │   ├── main.py       # Uygulama girişi, router mount
│       │   ├── config.py     # pydantic-settings (.env)
│       │   ├── database.py   # Beanie bağlantısı
│       │   ├── models/       # MongoDB document modelleri
│       │   ├── schemas/      # Pydantic request/response
│       │   ├── routers/      # /v1/* endpoint'leri
│       │   └── services/
│       ├── requirements.txt
│       ├── seed.py           # Varsayılan orbit’ler
│       └── .env.example
```

---

## Backend API (FastAPI)

Ayrı servis: **`http://localhost:4000`**. Web ve mobile bu URL üzerinden konuşur (`NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL`).

| Özellik | Detay |
|---|---|
| Framework | FastAPI — OpenAPI / Swagger **otomatik** |
| Dokümantasyon | `/docs` (Swagger UI), `/redoc`, `/openapi.json` |
| Auth | JWT (`Authorization: Bearer <accessToken>`) — register, login, refresh |
| Prefix | Tüm route'lar `/v1/...` |

**Router grupları:** `auth` · `users` · `posts` · `feed` · `orbits` · `notifications` · `conversations` · `bookmarks`

**Yerel geliştirme:** `Start.md` dosyasındaki adımları izle (Docker MongoDB, `pip install`, `seed.py`, `uvicorn`).

```bash
cd infra && docker compose up -d mongodb   # host port 27018
cd apps/api && pip install -r requirements.txt
cp .env.example .env                       # MONGODB_URI=127.0.0.1:27018
python seed.py
python -m uvicorn app.main:app --reload --port 4000
```

> **Windows notu:** Yerel MongoDB 27017’yi işgal edebilir; Docker portu **27018** kullanılır.

---

## Tasarım Sistemi (X.com Birebir)

### Renkler

```css
/* globals.css — X.com token'ları */
:root {
  /* Arka planlar */
  --color-bg-primary: #000000;
  --color-bg-secondary: #16181c;
  --color-bg-tertiary: #1d1f23;
  --color-bg-hover: rgba(255,255,255,0.03);

  /* Metin */
  --color-text-primary: #e7e9ea;
  --color-text-secondary: #71767b;
  --color-text-tertiary: #3e4144;

  /* Vurgu (X mavisi) */
  --color-accent: #1d9bf0;
  --color-accent-hover: #1a8cd8;

  /* Kenarlık */
  --color-border: #2f3336;

  /* Aksiyon renkleri */
  --color-like: #f91880;
  --color-repost: #00ba7c;
  --color-reply: #1d9bf0;

  /* Orbly özgün (niş rozeti) */
  --color-orbit: #7856ff;
}
```

### Tipografi

```css
/* X.com font stack birebir */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             Helvetica, Arial, sans-serif;

/* Font büyüklükleri */
--text-xs:   13px;  /* meta bilgiler, tarih */
--text-sm:   14px;  /* ikincil metin, reply sayısı */
--text-base: 15px;  /* post içeriği (X default) */
--text-lg:   17px;  /* profil ismi, section başlıkları */
--text-xl:   20px;  /* modal başlıkları */
--text-2xl:  23px;  /* sayfa başlıkları */

/* Font ağırlıkları */
--font-normal: 400;
--font-medium: 500; /* yazar ismi */
--font-bold:   700; /* başlıklar, CTA */
```

### Spacing & Layout

```
Sol sidebar genişliği: 275px (desktop) / 68px (tablet, sadece ikonlar)
Feed genişliği:        600px
Sağ sidebar:           350px
Mobil: tam ekran feed, alt navigation bar
Post padding: 12px 16px
Border-radius genel: 9999px (pill butonlar), 16px (kartlar)
```

---

## Veritabanı Şeması (MongoDB)

> Collection alanları **camelCase** (`displayName`, `authorId`, …) — API (Beanie) ve legacy Mongoose şemaları uyumludur.
> Production’da Atlas Replica Set önerilir (Change Streams / transaction için).

### Şema tanımları (referans — Mongoose)

Canlı API modelleri: `apps/api/app/models/`. Aşağıdaki örnekler `packages/db` ile aynı yapıyı gösterir.

```typescript
// packages/db/models/User.ts
const UserSchema = new Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 50 },
  displayName:  { type: String, required: true, maxlength: 100 },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },                          // OAuth kullanıcılarda boş
  bio:          { type: String, maxlength: 160 },
  avatarUrl:    { type: String },
  bannerUrl:    { type: String },
  location:     { type: String, maxlength: 100 },
  website:      { type: String, maxlength: 255 },
  verified:     { type: Boolean, default: false },
  role:         { type: String, enum: ['user','admin'], default: 'user' },
  isPrivate:    { type: Boolean, default: false },
  isBanned:     { type: Boolean, default: false },
  onboarded:    { type: Boolean, default: false },
  // Gömülü sayaçlar — JOIN'siz okuma
  stats: {
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount:     { type: Number, default: 0 },
  },
  // Kullanıcının üye olduğu orbit id'leri
  orbitIds: [{ type: Schema.Types.ObjectId, ref: 'Orbit' }],
}, { timestamps: true });

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
```

```typescript
// packages/db/models/Post.ts
const PostSchema = new Schema({
  authorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:     { type: String, required: true, maxlength: 280 },
  mediaUrls:   [{ type: String }],
  replyToId:   { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  repostOfId:  { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  orbitId:     { type: Schema.Types.ObjectId, ref: 'Orbit', default: null },
  hashtags:    [{ type: String }],          // parse edilip ayrı dizide tutulur
  mentions:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Sayaçlar — $inc ile atomik güncelleme
  stats: {
    likeCount:     { type: Number, default: 0 },
    replyCount:    { type: Number, default: 0 },
    repostCount:   { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    viewCount:     { type: Number, default: 0 },
  },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ orbitId: 1, createdAt: -1 });
PostSchema.index({ replyToId: 1 });
PostSchema.index({ hashtags: 1 });
// Atlas Search index ayrıca tanımlanır (UI veya mongocli ile)
```

```typescript
// packages/db/models/Orbit.ts
const OrbitSchema = new Schema({
  slug:        { type: String, required: true, unique: true, lowercase: true },
  name:        { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  iconUrl:     { type: String },
  bannerUrl:   { type: String },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  stats: {
    memberCount: { type: Number, default: 0 },
    postCount:   { type: Number, default: 0 },
  },
}, { timestamps: true });
```

```typescript
// packages/db/models/Follow.ts  — Takip grafiği
const FollowSchema = new Schema({
  followerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });   // "kim takip ediyor" sorgusu için
```

```typescript
// packages/db/models/Like.ts
const LikeSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postId:  { type: Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
```

```typescript
// packages/db/models/Notification.ts
const NotificationSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorId:  { type: Schema.Types.ObjectId, ref: 'User' },
  type:     { type: String, enum: ['like','reply','repost','follow','mention','orbit_invite'], required: true },
  postId:   { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  isRead:   { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
```

```typescript
// packages/db/models/Conversation.ts + Message.ts
const ConversationSchema = new Schema({
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    content:   String,
    senderId:  Schema.Types.ObjectId,
    createdAt: Date,
  },
  unreadCounts: { type: Map, of: Number, default: {} },
}, { timestamps: true });

ConversationSchema.index({ participantIds: 1 });

const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:        { type: String, required: true },
  mediaUrls:      [{ type: String }],
  isRead:         { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });
```

---

### Aggregation Pipeline Örnekleri

```typescript
// 1. FOR YOU FEED — kişiselleştirilmiş ranking pipeline
db.posts.aggregate([
  // Adım 1: Kullanıcının takip ettikleri + orbit'lerinin postlarını al
  { $match: {
      $or: [
        { authorId: { $in: followingIds } },
        { orbitId:  { $in: userOrbitIds } },
      ],
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // son 48 saat
  }},

  // Adım 2: Engagement skoru hesapla
  { $addFields: {
    engagementScore: {
      $add: [
        { $multiply: ['$stats.likeCount',     1   ] },
        { $multiply: ['$stats.replyCount',    2   ] },
        { $multiply: ['$stats.repostCount',   3   ] },
        { $multiply: ['$stats.bookmarkCount', 1.5 ] },
      ]
    },
    // Time decay: (şimdi - createdAt) saat cinsinden
    ageHours: {
      $divide: [
        { $subtract: [new Date(), '$createdAt'] },
        3600000
      ]
    }
  }},

  // Adım 3: Niş boost — kullanıcının orbit'indense 2x
  { $addFields: {
    nicheBoost: {
      $cond: [{ $in: ['$orbitId', userOrbitIds] }, 2, 1]
    }
  }},

  // Adım 4: Final skor = engagement × nicheBoost / (ageHours + 2)^1.5
  { $addFields: {
    finalScore: {
      $divide: [
        { $multiply: ['$engagementScore', '$nicheBoost'] },
        { $pow: [{ $add: ['$ageHours', 2] }, 1.5] }
      ]
    }
  }},

  // Adım 5: Sırala, sayfalama
  { $sort: { finalScore: -1, createdAt: -1 } },
  { $skip: page * 20 },
  { $limit: 20 },

  // Adım 6: Yazar bilgisini join et
  { $lookup: {
    from: 'users',
    localField: 'authorId',
    foreignField: '_id',
    as: 'author',
    pipeline: [
      { $project: { username:1, displayName:1, avatarUrl:1, verified:1 } }
    ]
  }},
  { $unwind: '$author' },

  // Adım 7: Orbit bilgisini join et (varsa)
  { $lookup: {
    from: 'orbits',
    localField: 'orbitId',
    foreignField: '_id',
    as: 'orbit',
    pipeline: [{ $project: { slug:1, name:1, iconUrl:1 } }]
  }},
  { $unwind: { path: '$orbit', preserveNullAndEmpty: true } },
]);

// 2. TRENDING HASHTAGS — son 24 saatte en çok kullanılan
db.posts.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 86400000) }, isDeleted: false }},
  { $unwind: '$hashtags' },
  { $group: { _id: '$hashtags', count: { $sum: 1 } }},
  { $sort: { count: -1 } },
  { $limit: 10 },
]);

// 3. REPLY ZİNCİRİ — bir postun tüm yanıt ağacı ($graphLookup)
db.posts.aggregate([
  { $match: { _id: rootPostId } },
  { $graphLookup: {
    from: 'posts',
    startWith: '$_id',
    connectFromField: '_id',
    connectToField: 'replyToId',
    as: 'replyTree',
    maxDepth: 10,
    depthField: 'depth',
  }},
]);

// 4. KULLANICI İSTATİSTİKLERİ — tek sorguda profil özeti
db.users.aggregate([
  { $match: { username: targetUsername }},
  { $lookup: { from:'follows', localField:'_id', foreignField:'followingId', as:'followers' }},
  { $lookup: { from:'follows', localField:'_id', foreignField:'followerId',  as:'following' }},
  { $addFields: {
    followersCount: { $size: '$followers' },
    followingCount: { $size: '$following' },
  }},
  { $project: { passwordHash: 0, followers: 0, following: 0 }},
]);
```

---

## Yapılacaklar — A'dan Z'ye

Her görev bağımsız bir Cursor AI agent görevi olarak verilebilir.

---

### FAZA 1 — Proje Kurulumu

- [x] **1.1** Monorepo başlat: `pnpm` + Turborepo
- [ ] **1.2** `apps/web` — Next.js 14 App Router + TypeScript kurulumu
- [ ] **1.3** Tailwind CSS kur, `globals.css`'e X.com design token'larını ekle
- [x] **1.4** `packages/db` — Mongoose 8 modelleri (referans); API tarafı Beanie (`apps/api/app/models/`)
- [ ] **1.5** MongoDB Atlas cluster oluştur (M10 Replica Set — Change Streams zorunlu), `.env` yapılandır
- [x] **1.6** Veri modelleri — User, Post, Orbit, Follow, Like, Bookmark, Notification, Conversation, Message
- [x] **1.6b** `apps/api` — FastAPI servisi, `/v1/*` route'lar, JWT auth, otomatik OpenAPI (`/docs`)
- [x] **1.6c** Yerel MongoDB — `infra/docker-compose.yml` (port **27018**), `apps/api/seed.py`
- [ ] **1.7** MongoDB Atlas Search index'lerini tanımla (posts için full-text)
- [ ] **1.8** Cloudflare R2 bucket aç, credentials ayarla
- [ ] **1.9** Upstash Redis oluştur, bağlantıyı test et
- [ ] **1.10** GitHub repo aç, branch stratejisi belirle (`main`, `dev`, `feature/*`)
- [ ] **1.11** Vercel'e `apps/web` deploy et (boş sayfa yeterli)
- [ ] **1.12** Railway'de `apps/api` servisi oluştur

---

### FAZA 2 — Kimlik Doğrulama

- [ ] **2.1** NextAuth.js v5 kur, `auth.ts` config dosyasını oluştur
- [ ] **2.2** Credentials provider — email/şifre, bcrypt ile hash
- [ ] **2.3** Google OAuth provider ekle
- [ ] **2.4** Apple OAuth provider ekle
- [ ] **2.5** `/login` sayfası — X.com birebir layout (sol logo, sağ form)
- [ ] **2.6** `/signup` sayfası — adım adım kayıt akışı
- [ ] **2.7** Email doğrulama akışı (Resend veya Nodemailer)
- [ ] **2.8** Şifremi unuttum / sıfırlama akışı
- [ ] **2.9** Auth middleware — korumalı route'lar için `middleware.ts`
- [ ] **2.10** JWT session yönetimi, refresh token rotasyonu

---

### FAZA 3 — Onboarding (Niş Seçimi)

- [ ] **3.1** Onboarding stepper bileşeni — X.com stil
- [ ] **3.2** Adım 1: Kullanıcı adı seç (gerçek zamanlı müsaitlik kontrolü)
- [ ] **3.3** Adım 2: Orbit seç — niş topluluklar grid görünümü (min 3 seç)
- [ ] **3.4** Adım 3: Takip önerileri — seçilen orbitlere göre kullanıcılar
- [ ] **3.5** Adım 4: Avatar yükle (isteğe bağlı) — R2'ye yükle
- [ ] **3.6** Onboarding tamamlanınca `users.onboarded = true` işaretle
- [ ] **3.7** Tamamlanmamış onboarding → her login'de yönlendir

---

### FAZA 4 — Layout & Navigation

- [ ] **4.1** Ana layout bileşeni — sol sidebar + feed + sağ sidebar
- [ ] **4.2** Sol sidebar: logo, nav linkleri, profil özeti, "Post Gönder" CTA
- [ ] **4.3** Sol sidebar collapse — tablet'te ikonlar, mobilden gizle
- [ ] **4.4** Mobil alt navigation bar — home, explore, notifications, messages
- [ ] **4.5** Sağ sidebar: arama, trend konular, takip önerileri
- [ ] **4.6** Feed container — 600px sabit genişlik, scroll yönetimi
- [ ] **4.7** Responsive breakpoint'ler — 1280px, 1024px, 768px, 375px
- [ ] **4.8** Dark mode zorunlu (X.com gibi varsayılan koyu tema)
- [ ] **4.9** Sayfa başlığı `<head>` yönetimi her route için

---

### FAZA 5 — Post Sistemi

- [x] **5.1** Post API — FastAPI: `POST /v1/posts`, `GET /v1/posts/{id}`, like/repost/reply (UI entegrasyonu bekliyor)
- [ ] **5.2** Post oluşturma kutusu — karakter sayacı (280), X.com birebir
- [ ] **5.3** Medya yükleme — fotoğraf (max 4), video (max 1), R2'ye yükle
- [ ] **5.4** GIF seçici entegrasyon (Tenor API)
- [ ] **5.5** Post kartı bileşeni — avatar, isim, username, tarih, içerik, medya grid
- [ ] **5.6** Beğeni aksiyonu — optimistic UI + API
- [ ] **5.7** Repost / Quote post aksiyonu
- [ ] **5.8** Reply aksiyonu — modal içinde yanıt yazma
- [ ] **5.9** Bookmark aksiyonu
- [ ] **5.10** View sayımı — intersection observer ile
- [ ] **5.11** Post paylaşım menüsü — link kopyala, embed, rapor et
- [ ] **5.12** Post silme (yazar ve admin için)
- [ ] **5.13** Post detay sayfası — `/post/[id]` — tam reply zinciri
- [ ] **5.14** Reply zinciri görünümü — iç içe replies
- [ ] **5.15** Hashtag algılama ve linklendirme
- [ ] **5.16** Mention algılama (`@kullanıcı`) ve linklendirme
- [ ] **5.17** URL önizleme kartı (Open Graph çekme)
- [ ] **5.18** Poll (anket) oluşturma — max 4 seçenek, son tarih

---

### FAZA 6 — Feed Algoritması

- [x] **6.1** "Following" API — `GET /v1/feed/following` (UI infinite scroll bekliyor)
- [x] **6.2** "For You" API — `GET /v1/feed/for-you` (aggregation pipeline, bkz. şema bölümü)
- [x] **6.2b** Trending / hashtag feed API — `GET /v1/feed/trending`, `GET /v1/feed/hashtag/{tag}`
- [ ] **6.3** Engagement skoru `$addFields` ile hesapla:
  `score = (likes×1 + replies×2 + reposts×3 + bookmarks×1.5) × nicheBoost / (ageHours+2)^1.5`
- [ ] **6.4** `time_decay` — `$subtract` + `$divide` ile saat cinsinden yaş, `$pow` ile ceza
- [ ] **6.5** `niche_boost` — `$cond` + `$in` ile orbit eşleşmesi → 2x çarpan
- [ ] **6.6** Social graph skoru — 2. derece bağlantı (`$lookup` + `$in`)
- [ ] **6.7** Redis fanout-on-write — post yazılınca BullMQ job'ı kuyruğa at, worker takipçilerin feed cache'ine eklesin
- [ ] **6.8** Cursor-based pagination — `_id` + `createdAt` çiftiyle sayfalama (infinite scroll)
- [ ] **6.9** "Daha yeni postlar var" banner — MongoDB Change Streams → Socket.io push
- [ ] **6.10** Feed karıştırma önleme — `$group` ile aynı yazardan max 2 art arda sınırı

---

### FAZA 7 — Orbit (Niş Topluluk) Sistemi

- [x] **7.1** Orbit API — listele, üye ol/çık (`/v1/orbits`) (admin CRUD UI bekliyor)
- [ ] **7.2** Orbit detay sayfası — `/orbits/[slug]`
- [ ] **7.3** Orbit'e katıl / ayrıl
- [ ] **7.4** Orbit feed — sadece o orbit'in postları
- [ ] **7.5** Orbit profil header — banner, ikon, isim, üye sayısı, katıl butonu
- [ ] **7.6** Orbit arama ve keşif sayfası
- [ ] **7.7** Orbit trending — o orbit içindeki gündem hashtagleri
- [ ] **7.8** Orbit üye listesi sayfası
- [ ] **7.9** Orbit rozeti — post kartında orbit ismi göster
- [ ] **7.10** Post yazarken orbit seç — açılır liste
- [ ] **7.11** Önerilen orbitler — profil sayfası sağ sidebar
- [ ] **7.12** Orbit istatistikleri — büyüme grafiği (admin panel)

---

### FAZA 8 — Kullanıcı Profili

- [ ] **8.1** Profil sayfası — `/profile/[username]` (X.com birebir layout)
- [ ] **8.2** Profil header — banner, avatar, isim, username, bio, lokasyon, site, katılım tarihi
- [ ] **8.3** Takip et / Takibi bırak butonu
- [ ] **8.4** Profil sekmeler — Postlar / Yanıtlar / Medya / Beğeniler / Orbit'ler
- [ ] **8.5** Profil düzenleme modal — isim, bio, lokasyon, site, avatar, banner
- [ ] **8.6** Takipçi / takip edilen sayısı ve sayfa linki
- [ ] **8.7** Ortak takipler göster ("X kişi takip ediyor")
- [ ] **8.8** Kullanıcı hover kartı — mini profil önizleme
- [ ] **8.9** Profil doğrulama rozeti (mavi tik sistemi)
- [ ] **8.10** Kullanıcı engelleme / sessize alma
- [ ] **8.11** Hesap devre dışı bırakma

---

### FAZA 9 — Arama & Keşif

- [ ] **9.1** Arama sayfası — `/explore`
- [ ] **9.2** Gerçek zamanlı arama önerileri — MongoDB Atlas Search (`autocomplete` operatörü)
- [ ] **9.3** Arama kategorileri — Herşey / Kişiler / Postlar / Orbit'ler
- [ ] **9.4** Trending konular — gerçek zamanlı hashtag sayımı (Redis sorted set + `ZINCRBY`)
- [ ] **9.5** Trending coğrafi filtreleme — Türkiye / Dünya
- [ ] **9.6** "Tanıyor olabileceklerin" — takip öneri algoritması (Follow graph `$lookup` + ortak orbit üyeliği)
- [ ] **9.7** Post tam metin arama — Atlas Search `$search` aggregation stage
- [ ] **9.8** Arama geçmişi — localStorage kayıt
- [ ] **9.9** Hashtag sayfası — `/#[tag]` — `{ $match: { hashtags: tag } }` pipeline

---

### FAZA 10 — Bildirimler

- [x] **10.1** Bildirim modeli + API — `/v1/notifications` (realtime push bekliyor)
- [ ] **10.2** Bildirim sayfası — `/notifications`
- [ ] **10.3** Bildirim tipleri: beğeni, yanıt, repost, takip, mention, orbit daveti
- [ ] **10.4** Gerçek zamanlı bildirim — MongoDB Change Streams → Socket.io
- [ ] **10.5** Bildirim zili — okunmamış sayı badge
- [ ] **10.6** "Hepsini okundu işaretle" — `{ $set: { isRead: true } }` bulk update
- [ ] **10.7** Bildirim filtreleme — Hepsi / Mention'lar
- [ ] **10.8** Push bildirimi — OneSignal entegrasyon
- [ ] **10.9** Email bildirim özeti — günlük digest (isteğe bağlı)

---

### FAZA 11 — Doğrudan Mesajlar (DM)

- [ ] **11.1** Konuşma listesi sayfası — `/messages`
- [ ] **11.2** Konuşma oluştur — kullanıcı arama + `Conversation` belgesi yarat
- [ ] **11.3** Mesaj detay sayfası — gerçek zamanlı chat
- [ ] **11.4** Realtime mesaj gönderme — Socket.io + MongoDB Change Streams
- [ ] **11.5** Okundu/iletildi bilgisi — `isRead` field + `$inc` unreadCounts
- [ ] **11.6** Mesajda medya gönderme — R2'ye yükle, URL kaydet
- [ ] **11.7** Konuşma silme
- [ ] **11.8** Mesaj istekler kutusu — takip edilmeyenlerden gelen mesajlar
- [ ] **11.9** Mesaj bildirimi — okunmamış sayı badge

---

### FAZA 12 — Yer İmleri

- [ ] **12.1** Yer imleri sayfası — `/bookmarks`
- [x] **12.2** Bookmark API — `/v1/bookmarks`
- [ ] **12.3** Bookmark klasörleri (isteğe bağlı, X Premium özelliği)
- [ ] **12.4** Tüm yer imlerini temizle

---

### FAZA 13 — Ayarlar

- [ ] **13.1** Ayarlar sayfası — `/settings` — X.com birebir sol menü layout
- [ ] **13.2** Hesap ayarları — kullanıcı adı, email, telefon değiştir
- [ ] **13.3** Şifre değiştir
- [ ] **13.4** Gizlilik ayarları — hesabı gizli yap, tagging izinleri
- [ ] **13.5** Bildirim ayarları — hangi bildirimleri al
- [ ] **13.6** Engellenen / sessize alınan hesaplar listesi
- [ ] **13.7** Devre dışı bırakılmış hesaplar
- [ ] **13.8** Veri indirme (KVKK uyumu)
- [ ] **13.9** Oturum yönetimi — aktif cihazlar, tümünden çıkış

---

### FAZA 14 — Admin Paneli

- [ ] **14.1** Admin panel route `/admin` — ayrı layout, rol kontrolü
- [ ] **14.2** Kullanıcı yönetimi — listele, ask, ban, doğrula
- [ ] **14.3** Post yönetimi — raporlanan postları incele, sil
- [ ] **14.4** Orbit yönetimi — oluştur, düzenle, kapat
- [ ] **14.5** Trend müdahalesi — trending konuları pin'le veya kaldır
- [ ] **14.6** Genel istatistikler — DAU, MAU, post sayısı, yeni kayıtlar
- [ ] **14.7** Raporlama kuyruğu — kullanıcı raporlarını işle

---

### FAZA 15 — Performans & Ölçeklenebilirlik

- [ ] **15.1** Redis feed cache — fanout-on-write, TTL ayarları (BullMQ worker)
- [ ] **15.2** Görsel optimizasyon — Next.js `<Image>`, WebP dönüşümü, R2 CDN
- [ ] **15.3** MongoDB compound index'leri — `{ authorId:1, createdAt:-1 }`, `{ orbitId:1, createdAt:-1 }`, `{ hashtags:1 }`
- [ ] **15.4** API rate limiting — kullanıcı başına `100 req/15dk` (Redis sliding window)
- [ ] **15.5** Infinite scroll — `IntersectionObserver` + `_id` cursor pagination
- [ ] **15.6** TanStack Query — sunucu cache + optimistic updates (`useMutation`)
- [ ] **15.7** Lazy load — ağır bileşenler için `React.lazy` + `Suspense`
- [ ] **15.8** Bundle analizi — `@next/bundle-analyzer` ile boyut optimizasyonu
- [ ] **15.9** MongoDB connection pool — `maxPoolSize: 10`, serverless'ta bağlantı önbelleği (`global.mongoose`)

---

### FAZA 16 — Güvenlik

- [ ] **16.1** API katmanında yetkilendirme — her route'da `session.user.id` kontrolü, başkasının verisine erişim engeli
- [x] **16.2** API input validation — Pydantic şemaları (FastAPI) her endpoint
- [ ] **16.3** XSS koruması — kullanıcı içeriğini sanitize et (DOMPurify client, `sanitize-html` server)
- [ ] **16.4** CSRF koruması — NextAuth.js built-in CSRF token
- [ ] **16.5** NoSQL injection koruması — Mongoose tip dönüşümü + `express-mongo-sanitize`
- [ ] **16.6** Medya yükleme güvenliği — MIME tür kontrolü, boyut limiti (5MB/fotoğraf), R2 presigned URL
- [ ] **16.7** Spam koruması — post hız sınırı, hesap yaşı kontrolü (Redis `INCR` + TTL)
- [ ] **16.8** Environment variable audit — `MONGODB_URI` ve gizli anahtarlar asla frontend'e sızmasın
- [ ] **16.9** HTTPS zorunlu, güvenli header'lar (`Content-Security-Policy`, `next.config` headers)

---

### FAZA 17 — Test

- [ ] **17.1** Birim testler — Vitest ile temel util fonksiyonlar
- [ ] **17.2** API route testleri — her endpoint için en az happy/sad path
- [ ] **17.3** Component testleri — React Testing Library
- [ ] **17.4** E2E testler — Playwright: kayıt, post gönder, beğen, takip et akışları
- [ ] **17.5** Load test — k6 ile feed endpoint'i (`100 eş zamanlı kullanıcı`)
- [ ] **17.6** CI'da test çalıştırma — GitHub Actions her PR'da

---

### FAZA 18 — DevOps & Deployment

- [ ] **18.1** Vercel production deploy — `main` branch otomatik
- [ ] **18.2** Railway / Fly.io API deploy — FastAPI + Uvicorn (Socket.io ayrı servis)
- [ ] **18.3** GitHub Actions CI pipeline — lint + test + build
- [ ] **18.4** Preview deploy — her PR için Vercel preview URL
- [ ] **18.5** MongoDB Atlas migration stratejisi — Mongoose şema versiyonlama, seed script'leri
- [ ] **18.6** Log yönetimi — Railway logs + Sentry entegrasyon
- [ ] **18.7** Uptime monitoring — Better Uptime veya Checkly
- [ ] **18.8** Backup — MongoDB Atlas otomatik yedek (M10+), R2 versioning

---

### FAZA 19 — SEO & Sosyal Paylaşım

- [ ] **19.1** Her sayfa için `<head>` metadata — title, description
- [ ] **19.2** Post detay sayfasında Open Graph ve Twitter Card meta tag
- [ ] **19.3** Profil sayfasında OG image oluşturma (`@vercel/og`)
- [ ] **19.4** `sitemap.xml` dinamik oluşturma
- [ ] **19.5** `robots.txt`
- [ ] **19.6** Canonical URL'ler

---

### FAZA 20 — Lansman Hazırlığı

- [ ] **20.1** Beta davet sistemi — email whitelist
- [ ] **20.2** Landing page — orbly.social ana sayfası (giriş yapılmamış)
- [ ] **20.3** Kullanım koşulları ve gizlilik politikası sayfaları
- [ ] **20.4** KVKK uyum değerlendirmesi
- [ ] **20.5** İlk orbit'leri elle oluştur (seed data)
- [ ] **20.6** Sosyal medya hesapları aç (@orbly_social)
- [ ] **20.7** Analytics entegrasyon — PostHog (gizlilik dostu)
- [ ] **20.8** Error tracking — Sentry production entegrasyon
- [ ] **20.9** Performans hedefi: LCP < 2.5s, FID < 100ms (Core Web Vitals)
- [ ] **20.10** Mobil test — iOS Safari + Android Chrome

---

## Cursor AI Agent İpuçları

Her faza görevini Cursor'a şu formatta ver:

```
Görev [FAZA X.Y]: [Görev başlığı]

Bağlam:
- Proje: Orbly.social — X.com benzeri sosyal ağ
- Stack: Next.js 14, TypeScript, Tailwind, FastAPI + Beanie (API), MongoDB, NextAuth.js v5 (web auth — API JWT ile konuşur)
- Tasarım: X.com birebir (renkler ve fontlar globals.css'de tanımlı)
- Aggregation pipeline örnekleri README'de mevcut, referans al

Yapılacak:
[Görevin detayı]

Referans dosyalar:
[İlgili mevcut dosyalar]
```

---

## Başlangıç Komutları

Detaylı rehber: **[Start.md](./Start.md)**

```bash
# Repo + frontend bağımlılıkları
git clone https://github.com/kullanici/orbly-social
cd orbly-social
pnpm install

# Web env
cp apps/web/.env.example apps/web/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

# MongoDB (Docker — port 27018)
cd infra && docker compose up -d mongodb && cd ..

# API env + Python
cp apps/api/.env.example apps/api/.env
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py

# API sunucusu
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
# veya proje kökünden: pnpm dev:api
```

| Servis | URL |
|--------|-----|
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |
| ReDoc | http://localhost:4000/redoc |
| Health | http://localhost:4000/health |

**Destek / hesap yardımı:** info@orbly.social

```bash
# Web (ayrı terminal)
pnpm dev:web
```

---

*Son güncelleme: Mayıs 2026 — API: FastAPI + Beanie (`apps/api`)*
