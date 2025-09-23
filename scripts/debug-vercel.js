#!/usr/bin/env node

/**
 * Vercel Debug Script
 * 
 * This script helps debug Vercel deployment issues by:
 * 1. Testing API endpoints locally
 * 2. Checking build configuration
 * 3. Validating environment setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Debug Script Starting...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// 1. Check package.json dependencies
console.log('📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['next', 'puppeteer', 'csv-stringify'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.error(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All required dependencies found');
  }
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// 2. Check Next.js configuration
console.log('\n⚙️  Checking Next.js configuration...');
try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    console.log('✅ next.config.js found');
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    if (config.includes('puppeteer')) {
      console.log('✅ Puppeteer configuration found');
    } else {
      console.log('⚠️  Puppeteer not configured in next.config.js');
    }
  } else {
    console.log('⚠️  next.config.js not found');
  }
} catch (error) {
  console.error('❌ Error checking Next.js config:', error.message);
}

// 3. Check Vercel configuration
console.log('\n🚀 Checking Vercel configuration...');
try {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    console.log('✅ vercel.json found');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    if (vercelConfig.functions) {
      console.log('✅ Function configuration found');
      Object.entries(vercelConfig.functions).forEach(([func, config]) => {
        console.log(`  - ${func}: maxDuration=${config.maxDuration}s`);
      });
    }
  } else {
    console.log('⚠️  vercel.json not found');
  }
} catch (error) {
  console.error('❌ Error checking Vercel config:', error.message);
}

// 4. Check API routes
console.log('\n🔌 Checking API routes...');
const apiRoutes = [
  'app/api/parse-conversation/route.ts',
  'app/api/generate-pdf/route.ts',
  'app/api/health/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route);
  if (fs.existsSync(routePath)) {
    console.log(`✅ ${route} found`);
  } else {
    console.log(`❌ ${route} missing`);
  }
});

// 5. Test build
console.log('\n🏗️  Testing build...');
try {
  console.log('Running: npm run build');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

// 6. Check for common issues
console.log('\n🔍 Checking for common issues...');

// Check if Puppeteer is properly installed
try {
  const puppeteerPath = path.join(process.cwd(), 'node_modules', 'puppeteer');
  if (fs.existsSync(puppeteerPath)) {
    console.log('✅ Puppeteer installed');
  } else {
    console.log('❌ Puppeteer not installed');
  }
} catch (error) {
  console.log('❌ Error checking Puppeteer installation');
}

// Check TypeScript configuration
try {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    console.log('✅ TypeScript configuration found');
  } else {
    console.log('⚠️  TypeScript configuration not found');
  }
} catch (error) {
  console.log('❌ Error checking TypeScript config');
}

console.log('\n🎯 Debug Summary:');
console.log('1. Check the build output above for any errors');
console.log('2. If Puppeteer issues, try: npm install puppeteer@latest');
console.log('3. If build fails, check TypeScript errors');
console.log('4. Deploy to Vercel and check function logs');
console.log('5. Test the health endpoint: /api/health');
console.log('6. Test with a real ChatGPT URL: /api/parse-conversation');

console.log('\n✨ Debug script completed!');
