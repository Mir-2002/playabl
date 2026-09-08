import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      // Spotify album art (Now Playing widget).
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
