import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface Message {
  role: string;
  content: string;
  timestamp: string;
  hasCodeBlocks: boolean;
  hasLinks: boolean;
  hasImages: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, url, title } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages data' }, { status: 400 });
    }

    // Generate HTML template
    const html = generateChatHTML(messages, url, title);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set timeout for page operations
    page.setDefaultTimeout(30000);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="chat-export-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateChatHTML(messages: Message[], url: string, title: string): string {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatGPT Conversation Export</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .meta-info {
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .meta-info h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        
        .meta-label {
            font-weight: 600;
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .meta-value {
            color: #495057;
            font-size: 14px;
            word-break: break-all;
        }
        
        .messages {
            margin-bottom: 30px;
        }
        
        .message {
            margin-bottom: 25px;
            padding: 20px;
            border-radius: 12px;
            position: relative;
            page-break-inside: avoid;
        }
        
        .message.user {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            margin-left: 0;
        }
        
        .message.assistant {
            background: #f3e5f5;
            border-left: 4px solid #9c27b0;
            margin-left: 0;
        }
        
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        .message-role {
            font-weight: 600;
            font-size: 16px;
            text-transform: capitalize;
        }
        
        .message-role.user {
            color: #1976d2;
        }
        
        .message-role.assistant {
            color: #7b1fa2;
        }
        
        .message-timestamp {
            font-size: 12px;
            color: #6c757d;
        }
        
        .message-content {
            font-size: 14px;
            line-height: 1.7;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .message-tags {
            display: flex;
            gap: 8px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .tag {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tag.code {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .tag.links {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .tag.images {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .footer {
            margin-top: 50px;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            .message {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ChatGPT Conversation Export</h1>
        <div class="subtitle">Generated on ${currentDate} at ${currentTime}</div>
    </div>
    
    <div class="meta-info">
        <h3>Conversation Details</h3>
        <div class="meta-grid">
            <div class="meta-item">
                <div class="meta-label">Source URL</div>
                <div class="meta-value">${url || 'N/A'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Title</div>
                <div class="meta-value">${title || 'Untitled Conversation'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Total Messages</div>
                <div class="meta-value">${messages.length}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Export Date</div>
                <div class="meta-value">${currentDate} ${currentTime}</div>
            </div>
        </div>
    </div>
    
    <div class="messages">
        ${messages.map((message, index) => `
            <div class="message ${message.role}">
                <div class="message-header">
                    <div class="message-role ${message.role}">${message.role}</div>
                    <div class="message-timestamp">${new Date(message.timestamp).toLocaleString()}</div>
                </div>
                <div class="message-content">${escapeHtml(message.content)}</div>
                <div class="message-tags">
                    ${message.hasCodeBlocks ? '<span class="tag code">Quote Block</span>' : ''}
                    ${message.hasLinks ? '<span class="tag links">Links</span>' : ''}
                    ${message.hasImages ? '<span class="tag images">Images</span>' : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>This conversation was exported using ChatGPT Parser</p>
        <p>Generated on ${currentDate} at ${currentTime}</p>
    </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const div = {
    innerHTML: text
  };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
