import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",   // necesario para el Dockerfile multi-stage de Railway
  reactStrictMode: true,
};

export default nextConfig;
