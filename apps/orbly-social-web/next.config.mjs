/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@orbly/api-client", "@orbly/types", "@orbly/features"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
