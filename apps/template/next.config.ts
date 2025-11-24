import type { NextConfig } from "next";
import path from "node:path";

// Check the env var. It defaults to "standalone" (isMonorepo = false) 
// if the variable is missing or anything other than exactly 'false'.
const isMonorepo = process.env.STANDALONE_MODE === 'false';

const nextConfig: NextConfig = {
  transpilePackages: ["portfolioly-schema", "portfolioly-template-components"],
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
  // If we are in the monorepo, trace files from 2 levels up.
  // If standalone (Vercel), keep it undefined to use the current folder.
  outputFileTracingRoot: isMonorepo ? path.resolve(__dirname, "../../") : undefined,
};

export default nextConfig;