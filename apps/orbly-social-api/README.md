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
