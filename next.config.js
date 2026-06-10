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
    serverComponentsExternalPackages: ["puppeteer", "@sparticuz/chromium"]
  },
  webpack: (config) => {
    config.externals.push({
      '@sparticuz/chromium': 'commonjs @sparticuz/chromium'
    });
    return config;
  }
};

module.exports = nextConfig;
