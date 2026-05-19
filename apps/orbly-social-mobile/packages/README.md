# Paylaşılan TS paketleri (yalnızca bu uygulama)

`types` → `api-client` → `features` — kod ve bağımlılıklar **yalnızca** `apps/orbly-social-mobile` içindedir.

- Her paketin kendi `package.json` ve `node_modules` vardır.
- Uygulama kökü `@orbly/*` için `file:./packages/...` kullanır.
- Kök repo `packages/` veya web uygulamasından import/script yok.
