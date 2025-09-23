# 🔍 Vercel Runtime Logs Guide

## Overview

Your app now has comprehensive logging that will help you debug issues on Vercel. This guide shows you how to access and use Vercel's runtime logs effectively.

## 🚀 Quick Start

### 1. Access Runtime Logs
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click the **"Logs"** tab
4. You'll see real-time logs from your functions

### 2. Test Your App
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Parse Conversation**: `https://your-app.vercel.app/api/parse-conversation` (POST)
- **Generate PDF**: `https://your-app.vercel.app/api/generate-pdf` (POST)

## 📊 Understanding Log Levels

Your app now uses structured logging with these levels:

| Level | Color | Description | Example |
|-------|-------|-------------|---------|
| **Info** | Blue | Normal operations | `[abc123] Starting conversation extraction` |
| **Warning** | Amber | 4xx status codes | `[abc123] Traditional fetch failed with status: 404` |
| **Error** | Red | 5xx status codes | `[abc123] Puppeteer approach failed: Error message` |

## 🔍 Log Filtering

### By Function
- **parse-conversation**: Logs from conversation parsing
- **generate-pdf**: Logs from PDF generation  
- **health**: Logs from health checks

### By Level
- **Info**: All normal operations
- **Warning**: 4xx errors (client issues)
- **Error**: 5xx errors (server issues)

### By Time
- **Live**: Real-time logs
- **Past Hour**: Last 60 minutes
- **Last 3 Days**: Extended history (Pro plan)

## 🐛 Common Issues & Solutions

### 1. Puppeteer Timeout Errors
**Look for**: `Puppeteer approach failed: timeout`
**Solution**: 
- Check if URL is accessible
- Verify Puppeteer configuration
- Check function timeout settings (currently 60s)

### 2. Memory Issues
**Look for**: `PDF generation error: out of memory`
**Solution**:
- Reduce PDF complexity
- Check message count limits
- Monitor memory usage in logs

### 3. Network Errors
**Look for**: `Traditional fetch failed with status: XXX`
**Solution**:
- Check if ChatGPT URL is valid
- Verify URL format
- Check if conversation is public

## 📝 Log Message Format

Each log entry follows this pattern:
```
2024-01-15T10:30:45.123Z [INFO] [requestId=abc123, action=parse] Starting conversation extraction for URL: https://chatgpt.com/share/xyz
```

### Key Fields:
- **Timestamp**: When the log was created
- **Level**: Info/Warning/Error
- **Request ID**: Unique identifier for tracking
- **Message**: Human-readable description
- **Data**: Additional context (if any)

## 🔧 Debugging Workflow

### Step 1: Check Health
```bash
curl https://your-app.vercel.app/api/health
```
Look for any errors in the health check logs.

### Step 2: Test Parsing
```bash
curl -X POST https://your-app.vercel.app/api/parse-conversation \
  -H "Content-Type: application/json" \
  -d '{"url": "https://chatgpt.com/share/your-conversation-id"}'
```

### Step 3: Analyze Logs
1. Filter by **Function**: `parse-conversation`
2. Look for **Error** level logs
3. Check the **Request ID** to trace the full request flow

## 📈 Performance Monitoring

### Key Metrics to Watch:
- **Function Duration**: How long each request takes
- **Memory Usage**: Available in health check logs
- **Success Rate**: Info vs Error log ratio
- **Timeout Rate**: Look for timeout errors

### Example Log Analysis:
```
[abc123] Starting conversation extraction request
[abc123] Trying traditional fetch approach...
[abc123] Traditional approach found 5 messages
[abc123] Successfully extracted 5 messages
[abc123] Request completed successfully in 2341ms
```

## 🚨 Alert-Worthy Patterns

Watch for these patterns in your logs:

### High Error Rate
- Multiple `Error` level logs
- Same error repeating frequently
- High 5xx status codes

### Performance Issues
- Long processing times (>30 seconds)
- Memory usage warnings
- Timeout errors

### Function Failures
- `Puppeteer approach failed` repeatedly
- `Traditional fetch failed` with 4xx/5xx
- `PDF generation error` messages

## 🛠️ Local Debugging

### Run Debug Script
```bash
npm run debug:vercel
```

### Test Locally
```bash
npm run debug:local
# Then test: http://localhost:3000/api/health
```

## 📋 Log Retention

| Plan | Retention |
|------|-----------|
| Hobby | 1 hour |
| Pro | 1 day |
| Pro + Observability Plus | 30 days |
| Enterprise | 3 days |
| Enterprise + Observability Plus | 30 days |

## 🔗 Useful Links

- [Vercel Runtime Logs Documentation](https://vercel.com/docs/observability/runtime-logs)
- [Vercel Function Limits](https://vercel.com/docs/functions/serverless-functions/runtimes)
- [Puppeteer on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes#puppeteer)

## 🎯 Next Steps

1. **Deploy your updated code** to Vercel
2. **Test the health endpoint** to verify logging works
3. **Try parsing a conversation** and watch the logs
4. **Set up monitoring** for error patterns
5. **Use the debug script** if you encounter issues

---

**Need Help?** Check the logs first - they'll tell you exactly what's happening! 🕵️‍♂️
