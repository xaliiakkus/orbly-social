# Vendored paylaşılan paketler

`types`, `api-client`, `features` — monorepo kökündeki `packages/` ile aynı kaynak; **ayrı `web` reposuna taşırken** kök `packages/` olmadan derlenebilmesi için burada tutulur.

- `apps/web/package.json` içinde `file:./packages/...` ile bağlanır.
- Kök `packages/` ile drift etmemek için değişiklikleri iki yere veya yalnızca buraya senkron tutun.
