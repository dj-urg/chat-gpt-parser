import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Health check requested`);
  
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId,
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] Health check completed in ${processingTime}ms`);

    return NextResponse.json(healthData);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Health check failed after ${processingTime}ms:`, error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestId,
      processingTime
    }, { status: 500 });
  }
}
