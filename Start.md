# Orbly.social — Başlangıç Rehberi

Bu dosya, monorepo’yu yerelde çalıştırmak için gereken adımları özetler. Web ve mobile uygulamaları ayrı; backend API `apps/api` altındadır.

---

## Gereksinimler

- **Node.js** 20+
- **pnpm** 10+ (`corepack enable` ile etkinleştirilebilir)
- **Docker** (yerel MongoDB için)

---

## 1. Bağımlılıkları yükle

```bash
cd orbly-social
pnpm install
```

---

## 2. MongoDB’yi başlat

```bash
cd infra
docker compose up -d mongodb
```

MongoDB: `mongodb://127.0.0.1:27018/orbly` (port **27018** — Windows’ta yerel Mongo ile 27017 çakışmasını önler)

Redis (isteğe bağlı, ileride cache/kuyruk için):

```bash
docker compose up -d redis
```

---

## 3. API ortam değişkenleri

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` içinde en az şunları kontrol et:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27018/orbly
JWT_SECRET=dev-secret-change-in-production-min-32-chars!!
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```

> `JWT_SECRET` üretmek için: `openssl rand -base64 32`

---

## 4. Seed verisi (orbit’ler + demo kullanıcı)

```bash
# Proje kökünden
MONGODB_URI=mongodb://127.0.0.1:27018/orbly pnpm db:seed
```

**Demo hesap**

| Alan | Değer |
|------|--------|
| Email | `demo@orbly.social` |
| Şifre | `password123` |
| Kullanıcı adı | `demo` |

---

## 5. API sunucusunu çalıştır (Python FastAPI)

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

**veya proje kökünden:** `pnpm dev:api` (aynı uvicorn komutunu çalıştırır)

API: **http://localhost:4000**

### Dokümantasyon (otomatik — elle swagger yazmaya gerek yok)

| URL | Açıklama |
|-----|----------|
| http://localhost:4000/docs | **Swagger UI** (FastAPI) |
| http://localhost:4000/redoc | **ReDoc** |
| http://localhost:4000/openapi.json | OpenAPI JSON |

Swagger'da **Authorize** → `Bearer <accessToken>`. Register/login endpoint'lerinde örnek body'ler hazır gelir.

Kök adres (`/`) otomatik olarak `/docs` sayfasına yönlendirir.

---

## 6. Web ve mobile bağlantısı

Web (`apps/web`) veya mobile (`apps/mobile`) için ortam değişkeni:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
# veya Next.js için:
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Kimlik doğrulama gerektiren isteklerde header:

```
Authorization: Bearer <accessToken>
```

Token almak: `POST /v1/auth/login` veya `POST /v1/auth/register`

---

## API endpoint özeti

Tüm route’lar `/v1` altında:

| Grup | Örnek |
|------|--------|
| Auth | `POST /v1/auth/register`, `/login`, `GET /v1/auth/me` |
| Kullanıcılar | `GET /v1/users/:username`, `POST /v1/users/:userId/follow` |
| Postlar | `POST /v1/posts`, `GET /v1/posts/:id`, `POST /v1/posts/:id/like` |
| Feed | `GET /v1/feed/following`, `GET /v1/feed/for-you`, `GET /v1/feed/trending` |
| Orbit | `GET /v1/orbits`, `POST /v1/orbits/:slug/join` |
| Bildirimler | `GET /v1/notifications` |
| Mesajlar | `GET /v1/conversations`, `POST /v1/conversations/:id/messages` |
| Yer imleri | `GET /v1/bookmarks`, `POST /v1/bookmarks/:postId` |

Detaylı ürün ve şema tanımları için `README.md` dosyasına bakın.

---

## Diğer komutlar

```bash
# Web (Next.js)
pnpm dev:web

# Tüm workspace (turbo)
pnpm dev
```

---

## Sorun giderme

### API MongoDB’ye bağlanamıyor

- `docker compose ps` ile `mongodb` konteynerinin çalıştığını doğrula.
- `MONGODB_URI` değerinin `.env` ile uyumlu olduğundan emin ol.

### Port 4000 dolu (`EADDRINUSE`)

```bash
# Windows — 4000 portunu kullanan işlemi bul
netstat -ano | findstr :4000
```

Ardından ilgili PID’yi sonlandır veya `apps/api/.env` içinde `PORT` değiştir.

### `pnpm --filter @orbly/api lint` / `tsc` çok yavaş veya bellek hatası

Geliştirmede API **`tsx`** ile çalışır; paketler kaynak dosyadan (`packages/*/src`) yüklenir. Tam `tsc` build CI veya production için ayrıca ayarlanabilir — yerel `pnpm dev:api` için gerekli değildir.

### Mongoose “Duplicate schema index” uyarısı

`username` ve `email` alanlarında `unique: true` zaten index oluşturur; ek `schema.index()` satırları kaldırıldı. Uyarı devam ederse API’yi yeniden başlat.

---

## Proje yapısı (API ile ilgili)

```
orbly-social/
├── apps/
│   ├── api/          # Fastify REST API
│   ├── web/          # Next.js
│   └── mobile/       # Expo
├── packages/
│   ├── config/       # Env (Zod)
│   ├── db/           # Mongoose modelleri + seed
│   └── types/        # Ortak TypeScript tipleri
└── infra/
    └── docker-compose.yml
```

---

*Son güncelleme: API katmanı kurulumu tamamlandıktan sonra.*
