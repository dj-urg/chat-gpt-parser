import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: string;
  content: string;
  timestamp: string;
  hasCodeBlocks: boolean;
  hasLinks: boolean;
  hasImages: boolean;
}

export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate URL format
    if (!url.includes('chatgpt.com/share/')) {
      return new Response(JSON.stringify({ error: 'Invalid ChatGPT share URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return a mock response since we can't use Puppeteer in Cloudflare Functions
    // You'll need to implement the actual parsing logic here
    const mockMessages: Message[] = [
      {
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date().toISOString(),
        hasCodeBlocks: false,
        hasLinks: false,
        hasImages: false
      },
      {
        role: 'assistant',
        content: 'I\'m doing well, thank you for asking!',
        timestamp: new Date().toISOString(),
        hasCodeBlocks: false,
        hasLinks: false,
        hasImages: false
      }
    ];

    // Generate CSV
    const csvHeaders = 'Message Number,Role,Content,Quote Block,Links,Images,Timestamp\n';
    const csvRows = mockMessages.map((message, index) => 
      `${index + 1},"${message.role}","${message.content.replace(/"/g, '""')}","${message.hasCodeBlocks ? 'Yes' : 'No'}","${message.hasLinks ? 'Yes' : 'No'}","${message.hasImages ? 'Yes' : 'No'}","${message.timestamp}"`
    ).join('\n');
    const csv = csvHeaders + csvRows;

    return new Response(JSON.stringify({
      messages: mockMessages,
      csv: csv,
      messageCount: mockMessages.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Parse error:', error);
    return new Response(JSON.stringify({ error: 'Failed to parse conversation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
