/**
 * branding/orbly-logo/logo.png → mobile ikon/splash seti.
 * Kullanım: yarn generate:icons (apps/orbly-social-mobile içinde)
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const sourceLogo = path.join(mobileRoot, "branding", "orbly-logo", "logo.png");

if (!existsSync(sourceLogo)) {
  throw new Error(
    `logo.png bulunamadı: ${sourceLogo}\nbranding/orbly-logo/logo.png dosyasını ekleyin.`,
  );
}

const ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512];
const EXPO_ICON_SIZE = 1024;
const SPLASH_LOGO_SIZE = 512;
const FAVICON_SIZE = 32;
const ADAPTIVE_SAFE_RATIO = 0.62;
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

async function resizeLogo(size, fit = "contain") {
  return sharp(sourceLogo)
    .resize(size, size, {
      fit,
      background: fit === "contain" ? BG : undefined,
    })
    .png()
    .toBuffer();
}

async function writeIcon(dir, name, buffer) {
  const file = path.join(dir, name);
  await writeFile(file, buffer);
  return file;
}

async function main() {
  const meta = await sharp(sourceLogo).metadata();
  if (!meta.width) {
    throw new Error(`Logo okunamadı: ${sourceLogo}`);
  }

  const mobileIconsDir = path.join(mobileRoot, "assets", "icons");
  const mobileImagesDir = path.join(mobileRoot, "assets", "images");

  await mkdir(mobileIconsDir, { recursive: true });
  await mkdir(mobileImagesDir, { recursive: true });

  console.log(`Kaynak: ${sourceLogo} (${meta.width}×${meta.height})\n`);

  for (const size of ICON_SIZES) {
    const buf = await resizeLogo(size);
    const out = await writeIcon(mobileIconsDir, `icon-${size}.png`, buf);
    console.log(`  ✓ ${path.relative(mobileRoot, out)}`);
  }

  const icon1024 = await resizeLogo(EXPO_ICON_SIZE);
  await writeIcon(mobileImagesDir, "icon.png", icon1024);
  console.log(`  ✓ assets/images/icon.png (${EXPO_ICON_SIZE}×${EXPO_ICON_SIZE})`);

  const adaptiveInner = Math.round(EXPO_ICON_SIZE * ADAPTIVE_SAFE_RATIO);
  const adaptiveLogo = await sharp(sourceLogo)
    .resize(adaptiveInner, adaptiveInner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const adaptive = await sharp({
    create: {
      width: EXPO_ICON_SIZE,
      height: EXPO_ICON_SIZE,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: adaptiveLogo, gravity: "center" }])
    .png()
    .toBuffer();
  await writeIcon(mobileImagesDir, "adaptive-icon.png", adaptive);
  console.log(`  ✓ assets/images/adaptive-icon.png`);

  const splashLogo = await resizeLogo(SPLASH_LOGO_SIZE);
  await writeIcon(mobileImagesDir, "splash-icon.png", splashLogo);
  console.log(`  ✓ assets/images/splash-icon.png`);

  const favicon = await resizeLogo(FAVICON_SIZE);
  await writeIcon(mobileImagesDir, "favicon.png", favicon);
  console.log(`  ✓ assets/images/favicon.png`);

  const manifest = {
    source: "branding/orbly-logo/logo.png",
    generatedAt: new Date().toISOString(),
    sizes: ICON_SIZES,
    iconsDir: "assets/icons",
    icon: "assets/images/icon.png",
    adaptiveIcon: "assets/images/adaptive-icon.png",
    splashIcon: "assets/images/splash-icon.png",
    favicon: "assets/images/favicon.png",
  };
  await writeFile(
    path.join(mobileIconsDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("\nTamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
