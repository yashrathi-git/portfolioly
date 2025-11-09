import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@portfolioly/schema",
    "@portfolioly/template-components",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
};

export default nextConfig;
// Orchids restart: 1758058985429
