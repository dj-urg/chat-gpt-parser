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
    // On Vercel, let Puppeteer find the Chrome binary automatically
    // by not specifying executablePath
    return {
      ...baseConfig,
      executablePath: undefined
    };
  } else {
    // Local development - use bundled Chrome
    return {
      ...baseConfig,
      executablePath: undefined
    };
  }
}

/**
 * Launch Puppeteer with Vercel-optimized configuration
 */
export async function launchPuppeteer() {
  const config = getPuppeteerConfig();
  console.log('Launching Puppeteer with config:', { 
    headless: config.headless, 
    executablePath: config.executablePath || 'auto-detect',
    isVercel: process.env.VERCEL === '1'
  });
  
  // Create launch config without undefined executablePath
  const launchConfig: any = {
    headless: config.headless,
    args: config.args
  };
  
  // Only add executablePath if it's defined
  if (config.executablePath) {
    launchConfig.executablePath = config.executablePath;
  }
  
  console.log('Final Puppeteer launch config:', launchConfig);
  const browser = await puppeteer.launch(launchConfig);
  console.log('Puppeteer browser launched successfully');
  return browser;
}
