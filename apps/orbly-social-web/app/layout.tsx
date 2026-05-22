import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { BRAND_APPLE_ICON, BRAND_ICON_SIZES, brandIconUrl } from "@/lib/brand";

import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://orbly.social").replace(
  /\/$/,
  "",
);
const siteTitle = "Orbly";
const siteDescription =
  "Niş topluluklara odaklanan sosyal ağ. İlgi alanlarına göre keşfet, paylaş ve canlı yayına katıl.";
const ogImage = brandIconUrl(512);
const twitterSite = process.env.NEXT_PUBLIC_TWITTER_SITE ?? "@orbly";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: siteTitle,
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 512,
        height: 512,
        alt: "Orbly logosu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: twitterSite,
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  icons: {
    icon: BRAND_ICON_SIZES.map((size) => ({
      url: brandIconUrl(size),
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
    apple: [{ url: BRAND_APPLE_ICON, sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
