# Yerel altyapı (MongoDB + Redis)

`docker-compose.yml` — kök `infra/` ile aynı içerik; **ayrı `api` reposunda** tek başına çalıştırmak için kopyalandı.

```bash
docker compose -f infra/docker-compose.yml up -d
```

Mongo varsayılan portu: **27018** (host), Redis: **6379**. `.env` içindeki bağlantı dizelerini buna göre ayarlayın.
