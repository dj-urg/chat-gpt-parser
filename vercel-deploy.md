# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (choose your account)
# - Link to existing project? No
# - What's your project's name? chatgpt-conversation-parser
# - In which directory is your code located? ./
```

### Option 2: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Click "Deploy"

## What I Fixed

1. **Removed `output: 'export'`** - This was causing the static export issue
2. **Removed `distDir: 'out'`** - Not needed for Vercel
3. **Kept Puppeteer support** - Works perfectly on Vercel
4. **API routes will work** - Vercel supports Next.js API routes natively

## Environment Variables (if needed)

If you need any environment variables:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add any required variables

## Your App Features

✅ **Working on Vercel:**
- Frontend UI
- API routes (`/api/parse-conversation`, `/api/generate-pdf`)
- Puppeteer for web scraping
- CSV generation
- PDF generation
- All export formats (CSV, PDF, JSON)

## Testing Your Deployment

After deployment, test these URLs:
- `https://your-app.vercel.app/` - Main page
- `https://your-app.vercel.app/api/parse-conversation` - API endpoint (should return method not allowed for GET)

## Troubleshooting

If you get any errors:
1. Check the Vercel function logs
2. Make sure all dependencies are in `package.json`
3. Verify the build completed successfully
