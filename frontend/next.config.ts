import type { NextConfig } from "next";

function resolveImageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "http", hostname: "localhost", port: "3001", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "3001", pathname: "/**" },
  ];

  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (raw.startsWith("http")) {
    try {
      const parsed = new URL(raw);
      patterns.push({
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        pathname: "/**",
      });
    } catch {
      // Ignore invalid URLs.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: resolveImageRemotePatterns(),
  },
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
