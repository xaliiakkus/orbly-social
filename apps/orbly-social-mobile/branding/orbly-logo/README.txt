Orbly.social — Logo Paketi
==========================

Dosyalar:
  orbly-icon.svg          Ana ikon (72x72) — açık zemin
  orbly-icon-dark.svg     Ana ikon (72x72) — koyu zemin (#9b7dff)
  orbly-icon-filled.svg   Dolu ikon (72x72) — mor arka plan, beyaz çizgiler
  orbly-icon-96.svg       Ikon 96x96
  orbly-icon-512.svg      Ikon 512x512 (app store, OG image)
  orbly-favicon-16.svg    Favicon 16x16
  orbly-favicon-32.svg    Favicon 32x32
  orbly-logo-light.svg    Tam logo — açık zemin (200x56)
  orbly-logo-dark.svg     Tam logo — koyu zemin (200x56)

Renkler:
  Ana mor      #7856ff  (açık zemin)
  Açık mor     #9b7dff  (koyu zemin)
  Siyah        #0d0d0d
  Beyaz        #ffffff

Font: DM Sans 600 (wordmark)

Next.js kullanımı:
  import Image from 'next/image'
  <Image src="/logo.svg" width={48} height={48} alt="Orbly" />

CSS değişkeni (globals.css):
  --color-orbit: #7856ff;
