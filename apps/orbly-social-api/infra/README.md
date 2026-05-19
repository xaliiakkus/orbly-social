# Yerel altyapı (MongoDB + Redis)

Bu API uygulamasına özel `docker-compose.yml`.

```bash
docker compose -f infra/docker-compose.yml up -d
```

Mongo varsayılan portu: **27018** (host), Redis: **6379**. `.env` bağlantı dizelerini buna göre ayarlayın.
