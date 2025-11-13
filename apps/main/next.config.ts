import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["portfolioly-schema", "portfolioly-template-components"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
