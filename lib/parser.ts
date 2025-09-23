// Client-side parsing logic for static export
export interface Message {
  role: string;
  content: string;
  timestamp: string;
  hasCodeBlocks: boolean;
  hasLinks: boolean;
  hasImages: boolean;
}

export function parseConversationFromHTML(html: string): Message[] {
  const messages: Message[] = [];
  
  // Simple HTML parsing for demonstration
  // In a real implementation, you'd use a proper HTML parser
  const lines = html.split('\n');
  let currentRole = '';
  let currentContent = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('?') && trimmedLine.length < 200) {
      if (currentRole && currentContent) {
        messages.push({
          role: currentRole,
          content: currentContent.trim(),
          timestamp: new Date().toISOString(),
          hasCodeBlocks: false,
          hasLinks: false,
          hasImages: false
        });
      }
      currentRole = 'user';
      currentContent = trimmedLine;
    } else if (trimmedLine.includes('I can help') || 
               trimmedLine.includes('Here') || 
               trimmedLine.length > 100) {
      if (currentRole && currentContent) {
        messages.push({
          role: currentRole,
          content: currentContent.trim(),
          timestamp: new Date().toISOString(),
          hasCodeBlocks: false,
          hasLinks: false,
          hasImages: false
        });
      }
      currentRole = 'assistant';
      currentContent = trimmedLine;
    } else if (currentRole && trimmedLine) {
      currentContent += ' ' + trimmedLine;
    }
  }
  
  // Add the last message
  if (currentRole && currentContent) {
    messages.push({
      role: currentRole,
      content: currentContent.trim(),
      timestamp: new Date().toISOString(),
      hasCodeBlocks: false,
      hasLinks: false,
      hasImages: false
    });
  }
  
  return messages;
}

export function generateCSV(messages: Message[]): string {
  const headers = 'Message Number,Role,Content,Quote Block,Links,Images,Timestamp\n';
  const rows = messages.map((message, index) => 
    `${index + 1},"${message.role}","${message.content.replace(/"/g, '""')}","${message.hasCodeBlocks ? 'Yes' : 'No'}","${message.hasLinks ? 'Yes' : 'No'}","${message.hasImages ? 'Yes' : 'No'}","${message.timestamp}"`
  ).join('\n');
  return headers + rows;
}

export function generateJSON(messages: Message[]): string {
  const data = {
    metadata: {
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      source: 'ChatGPT Parser'
    },
    messages: messages
  };
  return JSON.stringify(data, null, 2);
}
