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
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium"]
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
      'puppeteer-core': 'commonjs puppeteer-core'
    });
    return config;
  }
};

module.exports = nextConfig;
