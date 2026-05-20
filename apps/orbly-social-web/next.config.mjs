import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const orblyPackages = {
  "@orbly/types": path.join(__dirname, "packages/types/src"),
  "@orbly/api-client": path.join(__dirname, "packages/api-client/src"),
  "@orbly/features": path.join(__dirname, "packages/features/src"),
};

function patternFromUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const pattern = {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
    };
    if (url.port) pattern.port = url.port;
    return pattern;
  } catch {
    return null;
  }
}

function buildImageRemotePatterns() {
  const patterns = [
    { protocol: "https", hostname: "**.idrivee2.com" },
    { protocol: "https", hostname: "res.cloudinary.com" },
    { protocol: "https", hostname: "**.cloudinary.com" },
    { protocol: "https", hostname: "media.tenor.com" },
    { protocol: "https", hostname: "**.giphy.com" },
    { protocol: "https", hostname: "i.giphy.com" },
    { protocol: "http", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" },
  ];

  const seen = new Set(patterns.map((p) => `${p.protocol}://${p.hostname}:${p.port ?? ""}`));

  for (const raw of [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_MEDIA_URL,
    process.env.NEXT_PUBLIC_IDRIVE_PUBLIC_URL,
    "https://s3.us-west-2.idrivee2.com",
  ]) {
    const pattern = patternFromUrl(raw);
    if (!pattern) continue;
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    patterns.push(pattern);
  }

  if (process.env.NODE_ENV === "development") {
    patterns.push({ protocol: "http", hostname: "**" });
  }

  return patterns;
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...orblyPackages,
    };
    return config;
  },
};

export default nextConfig;
