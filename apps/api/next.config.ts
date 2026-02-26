import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  transpilePackages: ["@torre-swipe/types", "@torre-swipe/torre-client"],
};

export default nextConfig;
