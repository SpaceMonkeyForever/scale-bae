import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // Allow blob URLs for image previews
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
  // Required for better-sqlite3 to work
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
