/** @type {import('next').NextConfig} */

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
    { protocol: "https", hostname: "**" },
    { protocol: "http", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" },
  ];

  const seen = new Set(patterns.map((p) => `${p.protocol}://${p.hostname}:${p.port ?? ""}`));

  for (const raw of [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_MEDIA_URL,
  ]) {
    const pattern = patternFromUrl(raw);
    if (!pattern) continue;
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    patterns.push(pattern);
  }

  // Yerel ağ (192.168.x.x vb.) — geliştirme ortamında API IP'si değişebilir
  if (process.env.NODE_ENV === "development") {
    patterns.push({ protocol: "http", hostname: "**" });
  }

  return patterns;
}

const nextConfig = {
  transpilePackages: ["@orbly/api-client", "@orbly/types", "@orbly/features"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
};

export default nextConfig;
