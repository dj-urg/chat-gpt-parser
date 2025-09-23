// Cloudflare Function for parsing conversations
export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ChatGPT share URL
    const chatgptUrlPattern = /^https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9-]+$/;
    if (!chatgptUrlPattern.test(url)) {
      return new Response(JSON.stringify({ error: 'Invalid ChatGPT share URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return mock data since Puppeteer won't work in Cloudflare Functions
    const mockMessages = [
      {
        role: 'user',
        content: 'Hello, can you help me with a coding problem?',
        timestamp: new Date().toISOString(),
        hasCodeBlocks: false,
        hasLinks: false,
        hasImages: false
      },
      {
        role: 'assistant',
        content: 'Of course! I\'d be happy to help you with your coding problem. What specific issue are you working on?',
        timestamp: new Date().toISOString(),
        hasCodeBlocks: false,
        hasLinks: false,
        hasImages: false
      }
    ];

    // Generate CSV
    const csvData = mockMessages.map((message, index) => ({
      'Message Number': index + 1,
      'Role': message.role,
      'Content': message.content,
      'Quote Block': message.hasCodeBlocks ? 'Yes' : 'No',
      'Links': message.hasLinks ? 'Yes' : 'No',
      'Images': message.hasImages ? 'Yes' : 'No',
      'Timestamp': message.timestamp
    }));

    const csv = csvData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');

    const csvWithHeaders = [
      'Message Number,Role,Content,Quote Block,Links,Images,Timestamp',
      csv
    ].join('\n');

    return new Response(JSON.stringify({
      messages: mockMessages,
      csv: csvWithHeaders,
      messageCount: mockMessages.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error parsing conversation:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse conversation. Please check the URL and try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}