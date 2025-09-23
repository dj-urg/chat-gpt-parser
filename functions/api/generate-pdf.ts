// Cloudflare Function for generating PDFs
export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const { messages, url, title } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For Cloudflare Functions, we can't use Puppeteer
    // Return a simple HTML response instead
    const html = generateSimpleHTML(messages, url, title);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="chat-export-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateSimpleHTML(messages: any[], url: string, title: string): string {
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
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .message { margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .message.user { border-left-color: #28a745; }
        .message.assistant { border-left-color: #6f42c1; }
        .role { font-weight: bold; margin-bottom: 10px; }
        .content { white-space: pre-wrap; }
        .meta { font-size: 12px; color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ChatGPT Conversation Export</h1>
        <p>Generated on ${currentDate} at ${currentTime}</p>
        <p><strong>Source:</strong> ${url || 'N/A'}</p>
        <p><strong>Title:</strong> ${title || 'Untitled Conversation'}</p>
        <p><strong>Total Messages:</strong> ${messages.length}</p>
    </div>
    
    ${messages.map((message, index) => `
        <div class="message ${message.role}">
            <div class="role">${message.role.toUpperCase()}</div>
            <div class="content">${escapeHtml(message.content)}</div>
            <div class="meta">
                Message #${index + 1} | ${new Date(message.timestamp).toLocaleString()}
                ${message.hasCodeBlocks ? ' | Contains Code' : ''}
                ${message.hasLinks ? ' | Contains Links' : ''}
                ${message.hasImages ? ' | Contains Images' : ''}
            </div>
        </div>
    `).join('')}
    
    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center; color: #666;">
        <p>This conversation was exported using ChatGPT Parser</p>
        <p>Generated on ${currentDate} at ${currentTime}</p>
    </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}