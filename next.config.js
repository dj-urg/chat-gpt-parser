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
  // Disable API routes for static export
  distDir: 'out'
}

module.exports = nextConfig
