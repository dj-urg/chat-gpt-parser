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
    // Return a simple text response instead
    const textContent = messages.map((msg: any, index: number) => 
      `${index + 1}. ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const response = new Response(textContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="chat-export-${new Date().toISOString().split('T')[0]}.txt"`
      }
    });

    return response;

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate export' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
