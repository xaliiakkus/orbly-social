/**
 * orbly-logo/logo.png → mobile + web ikon/splash seti.
 * Kullanım: pnpm run generate:icons (apps/mobile veya kök)
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const webRoot = path.resolve(mobileRoot, "../web");
const repoRoot = path.resolve(mobileRoot, "../..");
const logoCandidates = [
  path.join(mobileRoot, "branding", "orbly-logo", "logo.png"),
  path.join(webRoot, "branding", "orbly-logo", "logo.png"),
  path.join(repoRoot, "orbly-logo", "logo.png"),
];
const sourceLogo = logoCandidates.find((p) => existsSync(p));
if (!sourceLogo) {
  throw new Error(
    `logo.png bulunamadı. Şunlardan birine ekleyin:\n${logoCandidates.join("\n")}`,
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
  const webPublicIcons = path.join(webRoot, "public", "icons");
  const webAppDir = path.join(webRoot, "app");

  await mkdir(mobileIconsDir, { recursive: true });
  await mkdir(mobileImagesDir, { recursive: true });
  await mkdir(webPublicIcons, { recursive: true });

  console.log(`Kaynak: ${sourceLogo} (${meta.width}×${meta.height})\n`);

  console.log("Mobile");
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

  console.log("\nWeb");
  for (const size of ICON_SIZES) {
    const buf = await resizeLogo(size);
    const out = await writeIcon(webPublicIcons, `icon-${size}.png`, buf);
    console.log(`  ✓ ${path.relative(webRoot, out)}`);
  }

  const webAppIcon = await resizeLogo(512);
  await writeIcon(webAppDir, "icon.png", webAppIcon);
  console.log(`  ✓ app/icon.png`);

  const appleIcon = await resizeLogo(180);
  await writeIcon(webAppDir, "apple-icon.png", appleIcon);
  console.log(`  ✓ app/apple-icon.png`);

  await sharp(await resizeLogo(FAVICON_SIZE)).toFile(path.join(webAppDir, "favicon.ico"));
  console.log(`  ✓ app/favicon.ico`);

  const manifest = {
    source: path.relative(mobileRoot, sourceLogo).startsWith("..")
      ? path.relative(repoRoot, sourceLogo).replace(/\\/g, "/")
      : path.relative(mobileRoot, sourceLogo).replace(/\\/g, "/"),
    generatedAt: new Date().toISOString(),
    sizes: ICON_SIZES,
    mobile: {
      iconsDir: "assets/icons",
      icon: "assets/images/icon.png",
      adaptiveIcon: "assets/images/adaptive-icon.png",
      splashIcon: "assets/images/splash-icon.png",
      favicon: "assets/images/favicon.png",
    },
    web: {
      iconsDir: "public/icons",
      appIcon: "app/icon.png",
      appleIcon: "app/apple-icon.png",
      favicon: "app/favicon.ico",
    },
  };
  await writeFile(
    path.join(mobileIconsDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  await writeFile(
    path.join(webPublicIcons, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("\nTamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
