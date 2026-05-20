# Orbly.social — Milestone & bağımlılık özeti

**Son güncelleme:** 2026-05-19  
Bu dosya; `apps/api`, `apps/web`, `apps/mobile` uygulamalarının **`packages`**, **`infra`**, **`orbly-logo`** ile ilişkisini ve mevcut ürün/teknik durumu özetler.

---

## Durum özeti (milestone)

| Alan | Durum |
|------|--------|
| **Çift istemci** | Web (Next.js 14) ve Mobile (Expo) aynı API ve `@orbly/features` iş mantığına hizalanıyor. |
| **Ortak TS katmanı** | `types` → `api-client` → `features`. Monorepo kökünde `packages/`; **ayrı repo için** aynı kaynak `apps/web/packages/` ve `apps/mobile/packages/` altında vendored + `package.json` içinde `file:./packages/...`. |
| **API** | FastAPI `/v1`, JWT, Beanie/MongoDB, Redis, Socket.io, R2/LiveKit vb. (`requirements.txt`). |
| **Bildirimler** | Sekmeler, gruplama (istemci), `postPreview` zenginleştirmesi, okundu; realtime payload tam parite için açık iş. |
| **Yanıtlar** | Düz thread + reply compose (web modal, mobile context); `packages/features` `reply-thread`. |
| **Marka / ikon** | `branding/orbly-logo/logo.png` (app içi) veya kök `orbly-logo/`; `pnpm generate:icons` önce mobil `branding/` yolunu dener. |

---

## `packages/` — hangi uygulama ne kullanıyor?

> **Repo bölme:** Web ve mobile artık aynı paketlerin bir kopyasını `apps/*/packages/` altında taşır; kök `packages/` ile içerik senkron tutulmalı.

### Web (`apps/web`)

| Bileşen | Açıklama |
|---------|----------|
| **`@orbly/types`** | Gönderi, kullanıcı, bildirim vb. paylaşılan tipler. |
| **`@orbly/api-client`** | `/v1` HTTP istemcisi, hata/format yardımcıları. |
| **`@orbly/features`** | React Query hook’ları, feed, beğeni, bildirim, compose, canlı, socket oda yardımcıları, bildirim UI/gruplama. |
| **Diğer önemli npm** | `next`, `next-auth`, `@tanstack/react-query`, `livekit-client`, `socket.io-client`, `zustand`, `tailwind` ekosistemi. |

**Not:** `@orbly/db` ve `@orbly/config` workspace’te tanımlıdır; web şu an bunları **package.json ile kullanmıyor** (legacy / ileride kullanım).

### Mobile (`apps/mobile`)

| Bileşen | Açıklama |
|---------|----------|
| **`@orbly/types`** | Web ile aynı. |
| **`@orbly/api-client`** | Web ile aynı. |
| **`@orbly/features`** | Web ile aynı hook ve bildirim mantığı. |
| **Diğer önemli npm** | `expo` / `expo-router`, `@tanstack/react-query`, LiveKit paketleri, `socket.io-client`, `zustand`. |
| **`@/components/ui/expo-image`** | `expo-image` + React 19 JSX tiplemesi uyumu için `createElement` köprüsü; görüntü bileşenleri buradan `Image` import eder. |

### API (`apps/api`)

| Bileşen | Açıklama |
|---------|----------|
| **`packages/*` (npm)** | **Yok.** Python servisi; Node workspace paketlerini import etmez. |
| **Şema uyumu** | İstemcilerle uyum **`packages/types` + `api-client`** üzerinden manuel/sözleşme ile** (OpenAPI `/openapi.json`). |
| **Python** | `requirements.txt`: FastAPI, Uvicorn, Beanie, Pydantic, Redis, boto3, Socket.io, LiveKit API, httpx, OAuth vb. |

**Monte edilen router’lar** (`app/main.py`): `auth`, `bookmarks`, `conversations`, `feed`, `live`, `live_webhook`, `media`, `notifications`, `orbits`, `posts`, `search`, `users`.

---

## `infra/` — ne sağlıyor?

Kök `infra/docker-compose.yml` yanında **`apps/api/infra/docker-compose.yml`** (aynı içerik) — API-only repo için yerel kopya.

| Servis | Port (varsayılan) | Kim kullanır? |
|--------|-------------------|---------------|
| **MongoDB** (`mongo:7`) | `27018` → `27017` | API (`MONGO`/Beanie bağlantısı `.env` ile). |
| **Redis** (`redis:7-alpine`) | `6379` | API önbellek / kuyruk / gerçek zamanlı yardımcıları (ayar `.env`). |

Web ve mobile **doğrudan infra klasörüne kod bağımlılığı taşımaz**; yalnızca API URL ve dolaylı olarak bu servislere ihtiyaç duyar.

---

## `orbly-logo/` — ne sağlıyor?

| Öğe | Kullanım |
|-----|----------|
| **`logo.png`** (kaynak) | `apps/mobile/scripts/generate-app-icons.mjs` — önce `apps/mobile/branding/orbly-logo/logo.png`, yoksa `apps/web/branding/...`, yoksa kök `orbly-logo/logo.png`. |
| **SVG’ler** | Marka referansı. |

**Yerel kopyalar:** `apps/mobile/branding/orbly-logo/`, `apps/web/branding/orbly-logo/` (kök klasörle aynı dosyalar).

---

## Paket içi notlar (bakım)

- **`packages/features`**: `@types/react` sürümü web ile uyum için **^18.3.28** (React 19 `ReactNode` / web `Provider` uyumsuzluğunu önlemek için).
- **Web `post-card` / `reply-compose-modal`**: `RefObject<… \| null>` ile `forwardRef` bileşenleri için `Ref` / `LegacyRef` atfı.

---

## Doğrulama komutları (syntax / tipler)

Aşağıdakiler bu milestone sırasında çalıştırıldı:

```bash
# TypeScript
pnpm --filter web exec tsc --noEmit
pnpm --filter mobile exec tsc --noEmit
pnpm --filter @orbly/features exec tsc --noEmit
pnpm --filter @orbly/api-client exec tsc --noEmit
pnpm --filter @orbly/types exec tsc --noEmit

# Python API
python -m compileall -q apps/api/app
```

---

## Sonraki aday işler (kısa)

Güncel tamamlanan / eksik liste: **[task.md](./task.md)** (rewet, keşfet algoritması, compose, profil vb.).

1. **Deploy** API (`/feed/explore`, rewet, refresh) — `task.md` E6.  
2. Rewet kalanları: profil rewet sekmesi (**R2**), gerçek zamanlı sayaç (**R6**), R4–R9.  
3. Keşfet: Haberler/Spor/Eğlence sekmeleri (**E1**), arama/geçmiş (**E2**).  
4. Bildirim sunucu toplulaştırma + socket `postPreview` paritesi.  
5. CI: `tsc` + `compileall` otomatik.
