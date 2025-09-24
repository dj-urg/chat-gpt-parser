/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', '@sparticuz/chromium', 'puppeteer-core'],
    webpackBuildWorker: true
  },
  // Vercel deployment compatibility
  images: {
    unoptimized: true
  },
  // Webpack configuration for Puppeteer
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer', '@sparticuz/chromium', 'puppeteer-core');
    }
    return config;
  }
}

module.exports = nextConfig
