/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  // Cloudflare Pages compatibility
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
