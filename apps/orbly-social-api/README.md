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
