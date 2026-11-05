import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't get confused by lockfiles in parent
  // directories (e.g. a stray ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  images: {
    // Sanity CDN will be added here when the CMS is wired up (Step 8).
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
    // Enables `forbidden()` / `unauthorized()` for auth helpers (403 UI).
    authInterrupts: true,
  },
};

export default nextConfig;
