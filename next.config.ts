import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Kunci root ke folder proyek ini agar Turbopack tidak memungut
    // package-lock.json liar di luar proyek (mis. di home directory).
    // File di luar proyek TIDAK disentuh; hanya cakupan resolve yang dibatasi.
    root: path.resolve(process.cwd()),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
