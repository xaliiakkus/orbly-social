# Orbly Social API

Bağımsız FastAPI servisi. Tüm kod, `infra/` ve ortam dosyaları bu klasörde; üst dizinden paylaşılan paket veya altyapı kullanılmaz.

## Gereksinimler

- Python 3.11+
- MongoDB ve Redis (`infra/docker-compose.yml`)

## Kurulum

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
```

## Altyapı

```bash
yarn infra:up
# veya: docker compose -f infra/docker-compose.yml up -d
```

## Çalıştırma

```bash
yarn dev
# veya: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

## Vercel deploy

CLI’yı **bu klasörden** (`apps/orbly-social-api`) çalıştırın. Vercel tüm projeyi okur; yalnızca `app/` altı değil.

```
apps/orbly-social-api/   ← Root Directory: ./
├── app/                 ← FastAPI paketi (main: app.main:app)
├── requirements.txt
├── pyproject.toml
├── infra/
└── seed.py
```

| Ayar | Değer |
|------|--------|
| **Root Directory** | `./` (boş / proje kökü) — **`./app` değil** |
| **Framework** | FastAPI (otomatik algılanır) |
| **Entrypoint** | `app.main:app` (`pyproject.toml`) |
| **Production** | https://orbly-social-api.vercel.app |

`./app` seçilirse `requirements.txt` ve paket yolu deploy dışında kalır → **404 NOT_FOUND**.

1. Dashboard → **Environment Variables**: `.env.example` (Atlas MongoDB, cloud Redis, `JWT_SECRET`, `CORS_ORIGIN`, R2, `API_PUBLIC_URL` vb.).
2. Deploy:

```bash
vercel --prod
```

İlk kurulumda “In which directory is your code located?” → **`./`**. Kontrol: `GET /health`, `GET /docs`.

## Fly.io (Socket.IO + uvicorn)

```bash
cd apps/orbly-social-api

# Zorunlu secret'lar — PowerShell'de çift tırnak DEĞİL, tek tırnak kullanın (& %26 kalır)
fly secrets set MONGO_URI='mongodb+srv://USER:34Patron47%26@cluster0.okyk1jy.mongodb.net/?appName=Cluster0'
fly secrets set JWT_SECRET='uzun-rastgele-string'
fly secrets set CORS_ORIGIN='https://orbly.social,http://localhost:3000'
fly secrets set API_PUBLIC_URL='https://api.orbly.social'

# Alternatif: .env.fly.example → .env.fly doldur
# fly secrets import < .env.fly

**Lokal `.env` dosyasını import etmeyin** — içinde `PORT=4000` ve `REDIS_ENABLED=true` var;
Fly proxy 8080 bekler, uygulama 4000’de kalır → `instance refused connection`.

Yanlışlıkla import ettiyseniz:
```bash
fly secrets unset PORT REDIS_URL
fly secrets set REDIS_ENABLED=false
```

Logda `Uvicorn running on ...:4000` görürseniz → `PORT` secret’ını kaldırın veya yeniden deploy.
Logda `Application startup complete` + `:8080` → OK.

fly deploy
fly logs
fly open /health
```

`REDIS_ENABLED=false` `fly.toml` içinde; Upstash kullanırsanız: `fly secrets set REDIS_URL="rediss://..." REDIS_ENABLED=true`.

Logda `127.0.0.1:27018` görürseniz → **MONGO_URI secret set edilmemiş**.
