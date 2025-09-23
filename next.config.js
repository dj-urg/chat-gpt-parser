/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
    webpackBuildWorker: true
  },
  // Vercel deployment compatibility
  images: {
    unoptimized: true
  },
  // Ensure proper build output
  output: 'standalone',
  // Webpack configuration for Puppeteer
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer');
    }
    return config;
  }
}

module.exports = nextConfig
