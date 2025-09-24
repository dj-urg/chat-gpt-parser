/**
 * Get Puppeteer launch configuration optimized for Vercel
 */
export async function getPuppeteerConfig() {
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
    // On Vercel, use @sparticuz/chromium-min with remote executable path
    console.log('Using Vercel configuration with chromium-min');
    const chromium = await import('@sparticuz/chromium-min');
    const remoteExecutablePath = 'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';
    
    const executablePath = await chromium.default.executablePath(remoteExecutablePath);
    console.log('Chromium executable path:', executablePath);
    
    return {
      ...baseConfig,
      args: [...chromium.default.args, ...baseConfig.args],
      executablePath: executablePath
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
  const isVercel = process.env.VERCEL === '1';
  let puppeteer: any;
  
  // Dynamically import the correct Puppeteer package
  if (isVercel) {
    puppeteer = await import('puppeteer-core');
  } else {
    puppeteer = await import('puppeteer');
  }
  
  const config = await getPuppeteerConfig();
  console.log('Launching Puppeteer with config:', { 
    headless: config.headless, 
    executablePath: config.executablePath || 'auto-detect',
    isVercel: isVercel
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
