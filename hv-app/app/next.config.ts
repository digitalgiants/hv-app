import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    // Lint locally with `npm run lint` — skip during Docker builds for speed
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@prisma/client"],
}

export default nextConfig
