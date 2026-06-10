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
  // Usamos el nombre antiguo/experimental que tu versión de Next.js reconoce
  experimental: {
    serverComponentsExternalPackages: ["puppeteer", "@sparticuz/chromium"]
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
      'puppeteer': 'commonjs puppeteer'
    });
    return config;
  }
};

module.exports = nextConfig;