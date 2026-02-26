/** @type {import("next").NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  transpilePackages: ["@torre-swipe/types", "@torre-swipe/torre-client"],
};

export default nextConfig;
