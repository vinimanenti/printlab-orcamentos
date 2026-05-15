import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer e prisma usam APIs nativas do Node (fs, stream, etc.).
  // Marcamos como "external" para que sejam carregadas em runtime em vez de
  // empacotadas pelo bundler.
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
