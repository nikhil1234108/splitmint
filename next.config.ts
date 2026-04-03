import type { NextConfig } from "next";

function getAllowedOrigins() {
  const origins = ["localhost:3000", "127.0.0.1:3000"];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    try {
      origins.push(new URL(appUrl).host);
    } catch {
      // Ignore malformed URLs and keep safe local defaults.
    }
  }

  return Array.from(new Set(origins));
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
};

export default nextConfig;
