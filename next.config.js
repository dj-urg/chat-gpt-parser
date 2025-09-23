/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  output: 'export',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  // Cloudflare Pages compatibility
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable server-side features for static export
  distDir: '.next'
}

module.exports = nextConfig
