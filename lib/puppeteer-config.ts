import puppeteer from 'puppeteer';

/**
 * Get Puppeteer launch configuration optimized for Vercel
 */
export function getPuppeteerConfig() {
  const isVercel = process.env.VERCEL === '1';
  
  const baseConfig = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  if (isVercel) {
    // On Vercel, use the system Chrome
    return {
      ...baseConfig,
      executablePath: '/usr/bin/google-chrome-stable'
    };
  } else {
    // Local development - use bundled Chrome
    return baseConfig;
  }
}

/**
 * Launch Puppeteer with Vercel-optimized configuration
 */
export async function launchPuppeteer() {
  const config = getPuppeteerConfig();
  console.log('Launching Puppeteer with config:', { 
    headless: config.headless, 
    executablePath: config.executablePath || 'bundled',
    isVercel: process.env.VERCEL === '1'
  });
  
  return await puppeteer.launch(config);
}
