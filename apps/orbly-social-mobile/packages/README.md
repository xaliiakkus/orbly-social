# Vendored paylaşılan paketler

`types`, `api-client`, `features` — monorepo kökündeki `packages/` ile aynı kaynak; **ayrı `mobile` reposuna taşırken** kök `packages/` olmadan derlenebilmesi için burada tutulur.

- `apps/mobile/package.json` içinde `file:./packages/...` ile bağlanır.
- Kök `packages/` ile drift etmemek için değişiklikleri iki yere veya yalnızca buraya senkron tutun.
