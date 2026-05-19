/**
 * public/icons/app_logo.png → icon-32 … icon-512 (letterbox / ekstra siyah yok).
 * Kullanım: node scripts/generate-web-icons.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const sourceLogo = path.join(webRoot, "public", "icons", "app_logo.png");
const outDir = path.join(webRoot, "public", "icons");

const ICON_SIZES = [32, 48, 64, 96, 128, 180, 192, 256, 512];

async function resizeIcon(size) {
  return sharp(sourceLogo)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

async function main() {
  const meta = await sharp(sourceLogo).metadata();
  console.log(`Kaynak: ${sourceLogo} (${meta.width}×${meta.height})\n`);

  for (const size of ICON_SIZES) {
    const buf = await resizeIcon(size);
    const file = path.join(outDir, `icon-${size}.png`);
    await writeFile(file, buf);
    console.log(`  ✓ icon-${size}.png`);
  }

  const manifest = {
    source: "public/icons/app_logo.png",
    generatedAt: new Date().toISOString(),
    sizes: ICON_SIZES,
    resize: { fit: "cover", position: "centre" },
  };
  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log("\nTamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
