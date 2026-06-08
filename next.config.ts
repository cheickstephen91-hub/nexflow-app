import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Requis pour Netlify + routes API Next.js (middleware, server actions)
  output: "standalone",
};

export default nextConfig;
