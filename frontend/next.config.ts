import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    const publicApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
    if (!publicApiUrl || !publicApiUrl.startsWith("/")) return [];

    const internal = (process.env.API_INTERNAL_URL ?? "http://localhost:3001")
      .trim()
      .replace(/\/+$/, "");

    return [
      {
        source: `${publicApiUrl}/:path*`,
        destination: `${internal}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
