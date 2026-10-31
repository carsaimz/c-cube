import type { NextConfig } from "next";

/**
 * C-Cube
 * - Padrão (dev/preview web): output "standalone".
 * - CUBE_STATIC_EXPORT=1 → exportação estática em ./out para Capacitor (Android)
 *   e Electron (PC). Usado pelos scripts `build:static`, `cap:sync` e `electron:*`.
 */
const base = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

const nextConfig: NextConfig =
  process.env.CUBE_STATIC_EXPORT === "1"
    ? {
        ...base,
        output: "export",
        distDir: ".next-static",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        ...base,
        output: "standalone",
      };

export default nextConfig;
