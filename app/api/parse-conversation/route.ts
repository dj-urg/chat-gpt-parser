import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import puppeteer from 'puppeteer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  hasCodeBlocks?: boolean;
  hasLinks?: boolean;
  hasImages?: boolean;
}

// Function to extract conversation data from dynamically loaded page
async function extractConversationWithPuppeteer(url: string): Promise<Message[]> {
  let browser;
  try {
    console.log('Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to URL:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the conversation content to load
    console.log('Waiting for conversation content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for content to load
    
    // Try to find conversation elements
    const messages = await page.evaluate(() => {
      const extractedMessages: Array<{role: string, content: string, timestamp: string, hasCodeBlocks: boolean, hasLinks: boolean, hasImages: boolean}> = [];
      const seenContent = new Set<string>(); // Track seen content to avoid duplicates
      
      // Function to analyze content for code blocks, links, and images (inside browser context)
      function analyzeContent(content: string): { hasCodeBlocks: boolean; hasLinks: boolean; hasImages: boolean } {
        if (!content) return { hasCodeBlocks: false, hasLinks: false, hasImages: false };
        
        // Check for code blocks (```code``` or `inline code` or common code patterns)
        const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`|def\s+\w+|function\s+\w+|class\s+\w+|import\s+\w+|from\s+\w+|console\.log|print\(|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(content);
        
        // Check for links (http/https URLs or markdown links)
        const hasLinks = /https?:\/\/[^\s]+|\[([^\]]+)\]\([^)]+\)/.test(content);
        
        // Check for images (markdown images or image URLs)
        const hasImages = /!\[([^\]]*)\]\([^)]+\)|\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?|oaiusercontent\.com.*\/files\/|Generated image|generated image|group\/imagegen-image|group\/image-gen|image-\w+-\w+-\w+-\w+-\w+/i.test(content);
        
        return { hasCodeBlocks, hasLinks, hasImages };
      }
      
      // Method 1: Look for modern ChatGPT conversation structure
      const conversationElements = document.querySelectorAll('[data-message-author-role], [data-testid*="conversation-turn"], .conversation-turn, [class*="conversation-turn"]');
      
      conversationElements.forEach((element) => {
        const role = element.getAttribute('data-message-author-role') || 
                    (element.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role')) ||
                    (element.classList.contains('user') || element.querySelector('.user') ? 'user' : 'assistant');
        
        // Get content from the message content area
        const contentElement = element.querySelector('[data-message-content], .message-content, [class*="message-content"]') || element;
        let content = contentElement.textContent?.trim() || '';
        
        // Clean up common prefixes
        content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
        
        // Check for images in the DOM within this message element
        const hasImagesInDOM = element.querySelector('img, [class*="imagegen-image"], [class*="image-gen"], [aria-label*="Generated image"], [aria-label*="generated image"], [id*="image-"]') !== null;
        
        // Check for code blocks in the DOM within this message element
        const hasCodeBlocksInDOM = element.querySelector('pre, code, [class*="code"], [class*="syntax"], .markdown pre') !== null;
        
        // Check if this is a valid message (has content OR has images)
        const hasValidContent = content && content.length > 10;
        const hasImagesOnly = !hasValidContent && hasImagesInDOM;
        
        if ((hasValidContent || hasImagesOnly) && (role === 'user' || role === 'assistant')) {
          // For image-only messages, try to extract text from image containers
          let finalContent = content;
          if (hasImagesOnly) {
            // Look for text content within image containers
            const imageContainer = element.querySelector('[class*="imagegen-image"], [class*="image-gen"], [aria-label*="Generated image"], [aria-label*="generated image"], [id*="image-"]');
            if (imageContainer) {
              const imageText = imageContainer.textContent?.trim() || '';
              if (imageText && imageText.length > 0) {
                finalContent = imageText;
              } else {
                // Fallback: look for any text in the entire element
                const elementText = element.textContent?.trim() || '';
                if (elementText && elementText.length > 0) {
                  finalContent = elementText;
                } else {
                  finalContent = '[Image only message]';
                }
              }
            } else {
              finalContent = '[Image only message]';
            }
          }
          
          // Check for duplicates by content or image presence
          const contentKey = hasValidContent ? `${role}:${content.substring(0, 100)}` : `${role}:image-${finalContent.substring(0, 50)}`;
          if (!seenContent.has(contentKey)) {
            seenContent.add(contentKey);
            const analysis = analyzeContent(finalContent || '');
            extractedMessages.push({
              role: role,
              content: finalContent,
              timestamp: new Date().toISOString(),
              hasCodeBlocks: analysis.hasCodeBlocks || hasCodeBlocksInDOM,
              hasLinks: analysis.hasLinks,
              hasImages: analysis.hasImages || hasImagesInDOM
            });
          }
        }
      });
      
      // Method 1b: Look for message elements with data attributes (fallback)
      if (extractedMessages.length === 0) {
        const messageElements = document.querySelectorAll('[data-message-author-role], [data-testid*="message"], .message');
        
        messageElements.forEach((element) => {
          const role = element.getAttribute('data-message-author-role') || 
                      (element.classList.contains('user') ? 'user' : 'assistant');
          let content = element.textContent?.trim() || '';
          
          // Clean up common prefixes
          content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
          
          // Check for images in the DOM within this message element
          const hasImagesInDOM = element.querySelector('img, [class*="imagegen-image"], [class*="image-gen"], [aria-label*="Generated image"], [aria-label*="generated image"], [id*="image-"]') !== null;
          // Check for code blocks in the DOM within this message element
          const hasCodeBlocksInDOM = element.querySelector('pre, code, [class*="code"], [class*="syntax"], .markdown pre') !== null;
          
          // Check if this is a valid message (has content OR has images)
          const hasValidContent = content && content.length > 10;
          const hasImagesOnly = !hasValidContent && hasImagesInDOM;
          
          if ((hasValidContent || hasImagesOnly)) {
            // For image-only messages, try to extract text from image containers
            let finalContent = content;
            if (hasImagesOnly) {
              // Look for text content within image containers
              const imageContainer = element.querySelector('[class*="imagegen-image"], [class*="image-gen"], [aria-label*="Generated image"], [aria-label*="generated image"], [id*="image-"]');
              if (imageContainer) {
                const imageText = imageContainer.textContent?.trim() || '';
                if (imageText && imageText.length > 0) {
                  finalContent = imageText;
                } else {
                  // Fallback: look for any text in the entire element
                  const elementText = element.textContent?.trim() || '';
                  if (elementText && elementText.length > 0) {
                    finalContent = elementText;
                  } else {
                    finalContent = '[Image only message]';
                  }
                }
              } else {
                finalContent = '[Image only message]';
              }
            }
            
            const contentKey = hasValidContent ? `${role}:${content.substring(0, 100)}` : `${role}:image-${finalContent.substring(0, 50)}`;
            if (!seenContent.has(contentKey)) {
              seenContent.add(contentKey);
              const analysis = analyzeContent(finalContent || '');
              extractedMessages.push({
                role: role,
                content: finalContent,
                timestamp: new Date().toISOString(),
                hasCodeBlocks: analysis.hasCodeBlocks || hasCodeBlocksInDOM,
                hasLinks: analysis.hasLinks,
                hasImages: analysis.hasImages || hasImagesInDOM
              });
            }
          }
        });
      }
      
      // Method 2: Look for conversation content in script tags
      if (extractedMessages.length === 0) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach((script) => {
          const scriptContent = script.textContent || '';
          
          // Look for conversation data patterns
          const patterns = [
            /"conversation":\s*(\{[\s\S]*?\})/,
            /"messages":\s*(\[[\s\S]*?\])/,
            /"linear_conversation":\s*(\[[\s\S]*?\])/,
            /window\.__NEXT_DATA__\s*=\s*(\{[\s\S]*?\})/,
            /"conversation_data":\s*(\{[\s\S]*?\})/,
            /"conversation_mapping":\s*(\{[\s\S]*?\})/,
            /"mapping":\s*(\{[\s\S]*?\})/,
            /"data":\s*\{[\s\S]*?"conversation":\s*(\{[\s\S]*?\})[\s\S]*?\}/
          ];
          
          patterns.forEach((pattern) => {
            const match = scriptContent.match(pattern);
            if (match) {
              try {
                const data = JSON.parse(match[1]);
                
                // Handle different data structures
                if (data.messages && Array.isArray(data.messages)) {
                  data.messages.forEach((msg: any) => {
                    if (msg.role && msg.content) {
                      let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                      content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                      const contentKey = `${msg.role}:${content.substring(0, 100)}`;
                      if (!seenContent.has(contentKey)) {
                        seenContent.add(contentKey);
                        const analysis = analyzeContent(content);
                        extractedMessages.push({
                          role: msg.role,
                          content: content,
                          timestamp: msg.timestamp || new Date().toISOString(),
                          hasCodeBlocks: analysis.hasCodeBlocks,
                          hasLinks: analysis.hasLinks,
                          hasImages: analysis.hasImages
                        });
                      }
                    }
                  });
                } else if (data.conversation && data.conversation.messages) {
                  data.conversation.messages.forEach((msg: any) => {
                    if (msg.role && msg.content) {
                      let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                      content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                      const contentKey = `${msg.role}:${content.substring(0, 100)}`;
                      if (!seenContent.has(contentKey)) {
                        seenContent.add(contentKey);
                        const analysis = analyzeContent(content);
                        extractedMessages.push({
                          role: msg.role,
                          content: content,
                          timestamp: msg.timestamp || new Date().toISOString(),
                          hasCodeBlocks: analysis.hasCodeBlocks,
                          hasLinks: analysis.hasLinks,
                          hasImages: analysis.hasImages
                        });
                      }
                    }
                  });
                } else if (data.conversation && Array.isArray(data.conversation)) {
                  data.conversation.forEach((item: any) => {
                    if (item.role && item.content) {
                      let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                      content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                      const contentKey = `${item.role}:${content.substring(0, 100)}`;
                      if (!seenContent.has(contentKey)) {
                        seenContent.add(contentKey);
                        const analysis = analyzeContent(content);
                        extractedMessages.push({
                          role: item.role,
                          content: content,
                          timestamp: item.timestamp || new Date().toISOString(),
                          hasCodeBlocks: analysis.hasCodeBlocks,
                          hasLinks: analysis.hasLinks,
                          hasImages: analysis.hasImages
                        });
                      }
                    }
                  });
                } else if (Array.isArray(data)) {
                  data.forEach((item: any) => {
                    if (item.role && item.content) {
                      let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                      content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                      const contentKey = `${item.role}:${content.substring(0, 100)}`;
                      if (!seenContent.has(contentKey)) {
                        seenContent.add(contentKey);
                        const analysis = analyzeContent(content);
                        extractedMessages.push({
                          role: item.role,
                          content: content,
                          timestamp: item.timestamp || new Date().toISOString(),
                          hasCodeBlocks: analysis.hasCodeBlocks,
                          hasLinks: analysis.hasLinks,
                          hasImages: analysis.hasImages
                        });
                      }
                    }
                  });
                } else if (data.mapping) {
                  // Handle conversation mapping structure
                  Object.values(data.mapping).forEach((item: any) => {
                    if (item.role && item.content) {
                      let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                      content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                      const contentKey = `${item.role}:${content.substring(0, 100)}`;
                      if (!seenContent.has(contentKey)) {
                        seenContent.add(contentKey);
                        const analysis = analyzeContent(content);
                        extractedMessages.push({
                          role: item.role,
                          content: content,
                          timestamp: item.timestamp || new Date().toISOString(),
                          hasCodeBlocks: analysis.hasCodeBlocks,
                          hasLinks: analysis.hasLinks,
                          hasImages: analysis.hasImages
                        });
                      }
                    }
                  });
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          });
        });
      }
      
      // Method 3: Look for visible conversation text
      if (extractedMessages.length === 0) {
        const mainContent = document.querySelector('main') || document.body;
        const textContent = mainContent?.textContent || '';
        
        // Try to split the text into user and assistant messages
        const lines = textContent.split('\n').filter(line => line.trim().length > 10);
        
        let currentRole: string | null = null;
        let currentContent = '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Detect role changes based on content patterns
          if (trimmedLine.includes('?') && trimmedLine.length < 200) {
            if (currentRole && currentContent) {
              extractedMessages.push({
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
                     trimmedLine.includes('To resolve') ||
                     trimmedLine.length > 100) {
            if (currentRole && currentContent) {
              extractedMessages.push({
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
          extractedMessages.push({
            role: currentRole,
            content: currentContent.trim(),
            timestamp: new Date().toISOString(),
            hasCodeBlocks: false,
            hasLinks: false,
            hasImages: false
          });
        }
      }
      
      return extractedMessages;
    });
    
    console.log(`Extracted ${messages.length} messages using Puppeteer`);
    return messages as Message[];
    
  } catch (error) {
    console.error('Error with Puppeteer:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Enhanced HTML parser for modern ChatGPT share pages
function parseHtmlContent(html: string): Message[] {
  const messages: Message[] = [];
  const seenContent = new Set<string>(); // Track seen content to avoid duplicates
  
  console.log('Starting HTML parsing...');
  
  // Function to analyze content for code blocks, links, and images
  function analyzeContent(content: string): { hasCodeBlocks: boolean; hasLinks: boolean; hasImages: boolean } {
    if (!content) return { hasCodeBlocks: false, hasLinks: false, hasImages: false };
    
    // Check for code blocks (```code``` or `inline code` or common code patterns)
    const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`|def\s+\w+|function\s+\w+|class\s+\w+|import\s+\w+|from\s+\w+|console\.log|print\(|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+/i.test(content);
    
    // Check for links (http/https URLs or markdown links)
    const hasLinks = /https?:\/\/[^\s]+|\[([^\]]+)\]\([^)]+\)/.test(content);
    
    // Check for images (markdown images or image URLs)
    const hasImages = /!\[([^\]]*)\]\([^)]+\)|\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?|oaiusercontent\.com.*\/files\/|Generated image|generated image|group\/imagegen-image|group\/image-gen|image-\w+-\w+-\w+-\w+-\w+/i.test(content);
    
    return { hasCodeBlocks, hasLinks, hasImages };
  }
  
  // Method 1: Look for React Router stream data containing conversation
  const streamDataPattern = /<script[^>]*>[\s\S]*?window\.__NEXT_DATA__\s*=\s*(\{[\s\S]*?\});[\s\S]*?<\/script>/g;
  let streamMatch;
  
  while ((streamMatch = streamDataPattern.exec(html)) !== null) {
    try {
      const nextData = JSON.parse(streamMatch[1]);
      console.log('Found Next.js data structure');
      
      // Look for conversation data in the Next.js data structure
      if (nextData.props?.pageProps?.conversation) {
        const conversation = nextData.props.pageProps.conversation;
        console.log('Found conversation in pageProps');
        
        if (conversation.messages && Array.isArray(conversation.messages)) {
          conversation.messages.forEach((msg: any) => {
            if (msg.role && msg.content) {
              messages.push({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString()
              });
            }
          });
        }
      }
      
      // Look for conversation in other possible locations
      if (nextData.props?.pageProps?.data?.conversation) {
        const conversation = nextData.props.pageProps.data.conversation;
        console.log('Found conversation in pageProps.data');
        
        if (conversation.messages && Array.isArray(conversation.messages)) {
          conversation.messages.forEach((msg: any) => {
            if (msg.role && msg.content) {
              messages.push({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString()
              });
            }
          });
        }
      }
      
      // Look for linear_conversation in the data
      if (nextData.props?.pageProps?.data?.linear_conversation) {
        const linearConv = nextData.props.pageProps.data.linear_conversation;
        console.log('Found linear_conversation');
        
        if (Array.isArray(linearConv)) {
          linearConv.forEach((item: any) => {
            if (item.role && item.content) {
              messages.push({
                role: item.role,
                content: item.content,
                timestamp: item.timestamp || new Date().toISOString()
              });
            }
          });
        }
      }
      
      if (messages.length > 0) break;
    } catch (e) {
      console.log('Error parsing Next.js data:', e);
    }
  }
  
  // Method 2: Look for conversation data in script tags with specific patterns
  if (messages.length === 0) {
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let scriptMatch;
    
    while ((scriptMatch = scriptPattern.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      
      // Look for various conversation data patterns
      const patterns = [
        /"conversation":\s*(\{[\s\S]*?\})/,
        /"messages":\s*(\[[\s\S]*?\])/,
        /"linear_conversation":\s*(\[[\s\S]*?\])/,
        /window\.__NEXT_DATA__\s*=\s*(\{[\s\S]*?\})/,
        /"conversation_data":\s*(\{[\s\S]*?\})/,
        /"conversation_mapping":\s*(\{[\s\S]*?\})/,
        /"mapping":\s*(\{[\s\S]*?\})/,
        /"data":\s*\{[\s\S]*?"conversation":\s*(\{[\s\S]*?\})[\s\S]*?\}/
      ];
      
      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            console.log('Found conversation data with pattern');
            
            // Process different data structures
            if (data.messages && Array.isArray(data.messages)) {
              data.messages.forEach((msg: any) => {
                if (msg.role && msg.content) {
                  let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                  content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                  const contentKey = `${msg.role}:${content.substring(0, 100)}`;
                  if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    messages.push({
                      role: msg.role,
                      content: content,
                      timestamp: msg.timestamp || new Date().toISOString()
                    });
                  }
                }
              });
            } else if (data.conversation && data.conversation.messages) {
              data.conversation.messages.forEach((msg: any) => {
                if (msg.role && msg.content) {
                  let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                  content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                  const contentKey = `${msg.role}:${content.substring(0, 100)}`;
                  if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    messages.push({
                      role: msg.role,
                      content: content,
                      timestamp: msg.timestamp || new Date().toISOString()
                    });
                  }
                }
              });
            } else if (data.conversation && Array.isArray(data.conversation)) {
              data.conversation.forEach((item: any) => {
                if (item.role && item.content) {
                  let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                  content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                  const contentKey = `${item.role}:${content.substring(0, 100)}`;
                  if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    messages.push({
                      role: item.role,
                      content: content,
                      timestamp: item.timestamp || new Date().toISOString()
                    });
                  }
                }
              });
            } else if (Array.isArray(data)) {
              // Handle linear_conversation format
              data.forEach((item: any) => {
                if (item.role && item.content) {
                  let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                  content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                  const contentKey = `${item.role}:${content.substring(0, 100)}`;
                  if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    messages.push({
                      role: item.role,
                      content: content,
                      timestamp: item.timestamp || new Date().toISOString()
                    });
                  }
                }
              });
            } else if (data.mapping) {
              // Handle conversation mapping structure
              Object.values(data.mapping).forEach((item: any) => {
                if (item.role && item.content) {
                  let content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                  content = content.replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '');
                  const contentKey = `${item.role}:${content.substring(0, 100)}`;
                  if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey);
                    messages.push({
                      role: item.role,
                      content: content,
                      timestamp: item.timestamp || new Date().toISOString()
                    });
                  }
                }
              });
            }
            
            if (messages.length > 0) break;
          } catch (e) {
            console.log('Error parsing conversation data:', e);
          }
        }
      }
      
      if (messages.length > 0) break;
    }
  }
  
  // Method 3: Look for conversation content in the HTML body
  if (messages.length === 0) {
    console.log('Trying to extract conversation from HTML body...');
    
    // Look for conversation content in the main content area
    const mainContentPattern = /<main[^>]*>([\s\S]*?)<\/main>/;
    const mainMatch = html.match(mainContentPattern);
    
    if (mainMatch) {
      const mainContent = mainMatch[1];
      
      // Look for message-like content in the main area
      const messagePatterns = [
        /<div[^>]*class="[^"]*message[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
        /<div[^>]*class="[^"]*conversation[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
        /<div[^>]*data-testid="[^"]*message[^"]*"[^>]*>([\s\S]*?)<\/div>/g
      ];
      
      for (const pattern of messagePatterns) {
        let match;
        while ((match = pattern.exec(mainContent)) !== null) {
          const messageContent = match[1];
          
          // Extract text content
          let content = messageContent
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (content && content.length > 10) {
            // Try to determine if this is user or assistant content
            const isUser = messageContent.includes('user') || 
                          messageContent.includes('You') ||
                          content.includes('?') && content.length < 200;
            const isAssistant = messageContent.includes('assistant') || 
                               messageContent.includes('ChatGPT') ||
                               content.includes('I can help') ||
                               content.includes('Here') ||
                               content.length > 100;
            
            if (isUser || isAssistant) {
              messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    }
  }
  
  // Method 4: Look for conversation content in the page title or meta description
  if (messages.length === 0) {
    console.log('Trying to extract from page metadata...');
    
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
    
    if (titleMatch && titleMatch[1].includes('ChatGPT')) {
      // This might be a conversation page, try to extract from the visible text
      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      // Look for conversation-like patterns in the text
      const lines = bodyText.split(' ').filter(word => word.length > 3);
      const conversationText = lines.join(' ');
      
      if (conversationText.length > 100) {
        // Try to split into user and assistant messages
        const parts = conversationText.split(/(?=I can help|Here|To resolve|What should|The issue|You need)/);
        
        if (parts.length >= 2) {
          // First part is likely user question
          const userContent = parts[0].trim();
          if (userContent.length > 10) {
            messages.push({
              role: 'user',
              content: userContent,
              timestamp: new Date().toISOString()
            });
          }
          
          // Remaining parts are assistant response
          const assistantContent = parts.slice(1).join(' ').trim();
          if (assistantContent.length > 10) {
            messages.push({
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  }
  
  console.log(`Found ${messages.length} messages`);
  return messages;
}

// Function to analyze content for code blocks, links, and images
function analyzeContent(content: string): { hasCodeBlocks: boolean; hasLinks: boolean; hasImages: boolean } {
  if (!content) return { hasCodeBlocks: false, hasLinks: false, hasImages: false };
  
  // Check for code blocks (```code``` or `inline code`)
  const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`/.test(content);
  
  // Check for links (http/https URLs or markdown links)
  const hasLinks = /https?:\/\/[^\s]+|\[([^\]]+)\]\([^)]+\)/.test(content);
  
  // Check for images (markdown images or image URLs)
  const hasImages = /!\[([^\]]*)\]\([^)]+\)|\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/i.test(content);
  
  return { hasCodeBlocks, hasLinks, hasImages };
}

// Function to clean content for proper CSV formatting
function cleanContentForCSV(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/^(You said:|ChatGPT said:|Assistant said:)\s*/i, '') // Remove common prefixes
    .replace(/\r\n/g, ' ') // Replace Windows line breaks with spaces
    .replace(/\n/g, ' ') // Replace Unix line breaks with spaces
    .replace(/\r/g, ' ') // Replace Mac line breaks with spaces
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/"/g, '""') // Escape quotes by doubling them (CSV standard)
    .trim(); // Remove leading/trailing whitespace
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate ChatGPT share URL
    const chatgptUrlPattern = /^https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9-]+$/;
    if (!chatgptUrlPattern.test(url)) {
      return NextResponse.json({ error: 'Invalid ChatGPT share URL format' }, { status: 400 });
    }

    console.log('Starting conversation extraction for URL:', url);

    // First try the traditional fetch approach
    let messages: Message[] = [];
    
    try {
      console.log('Trying traditional fetch approach...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        messages = parseHtmlContent(html);
        console.log(`Traditional approach found ${messages.length} messages`);
      }
    } catch (error) {
      console.log('Traditional fetch failed:', error);
    }

    // If traditional approach didn't work, try Puppeteer
    if (messages.length === 0) {
      console.log('Trying Puppeteer approach...');
      try {
        messages = await extractConversationWithPuppeteer(url);
        console.log(`Puppeteer approach found ${messages.length} messages`);
      } catch (error) {
        console.error('Puppeteer approach failed:', error);
      }
    }

    if (messages.length === 0) {
      return NextResponse.json({ 
        error: 'No conversation messages found. The conversation might be private, the URL format has changed, or the page requires JavaScript to load content.' 
      }, { status: 404 });
    }

    // Convert to CSV format with proper content cleaning
    const csvData = messages.map((message, index) => ({
      'Message Number': index + 1,
      'Role': message.role,
      'Content': cleanContentForCSV(message.content),
        'Quote Block': message.hasCodeBlocks ? 'Yes' : 'No',
      'Links': message.hasLinks ? 'Yes' : 'No',
      'Images': message.hasImages ? 'Yes' : 'No',
      'Timestamp': message.timestamp || new Date().toISOString()
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: ['Message Number', 'Role', 'Content', 'Quote Block', 'Links', 'Images', 'Timestamp'],
      quoted: true, // Ensure all fields are quoted
      quoted_empty: false,
      delimiter: ',',
      escape: '"' // Properly escape quotes
    });

    return NextResponse.json({
      messages: messages,
      csv: csv,
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error parsing conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to parse conversation. Please check the URL and try again.' 
    }, { status: 500 });
  }
}