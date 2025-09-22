# Cloudflare Pages Deployment Guide

## Prerequisites
- Cloudflare account
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally

## Deployment Steps

### 1. Prepare Your Repository
Make sure your code is pushed to your Git repository with all the latest changes.

### 2. Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your Git provider and repository

### 3. Configure Build Settings
- **Framework preset**: Next.js
- **Build command**: `npm run pages:build`
- **Build output directory**: `.next`
- **Root directory**: `/` (or leave empty if repository root)

### 4. Environment Variables (Optional)
If you need any environment variables, add them in the Cloudflare Pages dashboard:
- Go to your project settings
- Navigate to **Environment variables**
- Add any required variables

### 5. Deploy
1. Click **Save and Deploy**
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.pages.dev`

## Build Configuration

The app is configured with:
- **Next.js 14** with App Router
- **Standalone output** for optimal performance
- **Puppeteer** for PDF generation
- **CORS headers** for API access
- **Security headers** for protection

## API Endpoints

The following API endpoints are available:
- `POST /api/parse-conversation` - Parse ChatGPT conversations
- `POST /api/generate-pdf` - Generate PDF exports

## Troubleshooting

### Build Issues
- Ensure Node.js version is 18+
- Check that all dependencies are in `package.json`
- Verify build command is correct

### PDF Generation Issues
- Puppeteer requires specific Cloudflare Pages configuration
- Check function timeout settings
- Ensure sufficient memory allocation

### CORS Issues
- Check `_headers` file configuration
- Verify API endpoint accessibility
- Test with different browsers

## Performance Optimization

- Images are unoptimized for Cloudflare Pages compatibility
- Static assets are served from Cloudflare CDN
- API routes use Cloudflare Functions
- PDF generation is server-side for security

## Security Features

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- CORS properly configured for API access
