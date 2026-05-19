/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@orbly/api-client", "@orbly/types", "@orbly/features"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
