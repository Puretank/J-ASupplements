/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.iherb.com"
      },
      {
        protocol: "https",
        hostname: "cloudinary.images-iherb.com"
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com"
      }
    ]
  },
  // 1. Eliminamos el prefijo 'experimental' ya que es nativo en Next.js moderno
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],

  // 2. Eliminamos completamente el bloque 'webpack'. 
  // Al usar 'serverExternalPackages', Next.js ya sabe exactamente qué hacer detrás de escena.
};

module.exports = nextConfig;