const fs = require('fs');

// Test the parsing logic
async function testParser() {
  try {
    const response = await fetch('https://chatgpt.com/share/68d1449d-2328-800b-8715-43f6696bfb19', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Look for the actual conversation content in the stream data
    const streamPattern = /window\.__reactRouterContext\.streamController\.enqueue\("P\d+:(.*?)"\)/g;
    let streamMatch;
    let foundConversation = false;

    while ((streamMatch = streamPattern.exec(html)) !== null) {
      const streamData = streamMatch[1];
      
      // Look for conversation content in the stream data
      if (streamData.includes('You\'ve hit a merge conflict') || 
          streamData.includes('merge conflict') ||
          streamData.includes('pandas==') ||
          streamData.includes('pillow==')) {
        
        console.log('Found conversation in stream data!');
        console.log('Stream data length:', streamData.length);
        
        // Extract the actual conversation content
        const conversationMatch = streamData.match(/You've hit a merge conflict.*?If anything breaks after the bump, tell me the error trace/s);
        
        if (conversationMatch) {
          console.log('\n=== FULL CONVERSATION ===');
          console.log(conversationMatch[0]);
          foundConversation = true;
          break;
        }
      }
    }
    
    if (!foundConversation) {
      console.log('No conversation content found in stream data');
      
      // Try to find any conversation-like content
      const contentPattern = /"([^"]{100,})"/g;
      let contentMatch;
      let count = 0;
      
      while ((contentMatch = contentPattern.exec(html)) !== null && count < 10) {
        const content = contentMatch[1];
        if (content.includes('merge conflict') || 
            content.includes('pandas') || 
            content.includes('pillow') ||
            content.includes('requirements.txt')) {
          console.log(`\n=== CONTENT ${count + 1} ===`);
          console.log(content.substring(0, 200) + '...');
          count++;
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testParser();
