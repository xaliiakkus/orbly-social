import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { BRAND_APPLE_ICON, BRAND_ICON_SIZES, brandIconUrl } from "@/lib/brand";

import "./globals.css";

export const metadata: Metadata = {
  title: "Orbly",
  description: "Niş topluluklara odaklanan sosyal ağ",
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
