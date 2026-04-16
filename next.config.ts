import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que `next dev` y `next build` compartan la misma salida y se pisen
  // los chunks cuando validamos builds mientras el servidor local sigue abierto.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
