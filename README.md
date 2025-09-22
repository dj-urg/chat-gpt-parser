# ChatGPT Conversation Parser

A modern Next.js application that allows users to parse ChatGPT conversation share links and export them in multiple formats (CSV, PDF, JSON). This app provides a beautiful interface for extracting and preserving ChatGPT conversations.

## Features

- 🔗 Parse ChatGPT public share links
- 📊 Export conversations as CSV format
- 📄 Generate beautiful PDF exports with chat formatting
- 📋 Export as JSON for data portability
- 👀 Preview conversations in a clean UI
- 💾 Download files directly
- 📋 Copy CSV content to clipboard
- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Fast parsing with server-side processing
- 🔍 Smart content detection (code blocks, links, images)
- 📱 Mobile-friendly interface
- 🚀 Deploy-ready for Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatgpt-conversation-parser
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Copy a ChatGPT conversation share link (e.g., `https://chatgpt.com/share/68d1449d-2328-800b-8715-43f6696bfb19`)
2. Paste the URL into the input field
3. Click "Parse Conversation" and wait for processing
4. Choose your export format:
   - **CSV**: For data analysis in Excel/Google Sheets
   - **PDF**: For beautiful visual preservation
   - **JSON**: For data portability and integration
5. Download or copy your exported conversation

## How It Works

The application uses web scraping to extract conversation data from ChatGPT share links. It:

1. Validates the URL format
2. Fetches the conversation page
3. Parses the HTML using Cheerio
4. Extracts user and assistant messages
5. Formats the data as CSV
6. Provides both UI preview and download functionality

## API Endpoints

### POST `/api/parse-conversation`

Parses a ChatGPT conversation URL and returns the conversation data.

**Request Body:**
```json
{
  "url": "https://chatgpt.com/share/68d1449d-2328-800b-8715-43f6696bfb19"
}
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "hasCodeBlocks": false,
      "hasLinks": false,
      "hasImages": false
    },
    {
      "role": "assistant", 
      "content": "I'm doing well, thank you!",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "hasCodeBlocks": false,
      "hasLinks": false,
      "hasImages": false
    }
  ],
  "csv": "Message Number,Role,Content,Quote Block,Links,Images,Timestamp\n1,user,Hello how are you?,No,No,No,2024-01-01T00:00:00.000Z\n2,assistant,I'm doing well thank you!,No,No,No,2024-01-01T00:00:00.000Z",
  "messageCount": 2
}
```

### POST `/api/generate-pdf`

Generates a beautiful PDF export of the conversation.

**Request Body:**
```json
{
  "messages": [...],
  "url": "https://chatgpt.com/share/...",
  "title": "ChatGPT Conversation - 2024-01-01"
}
```

**Response:**
Returns a PDF file as binary data with appropriate headers.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Puppeteer** - PDF generation and web scraping
- **csv-stringify** - CSV generation
- **Lucide React** - Icons
- **Cloudflare Pages** - Deployment platform

## Limitations

- Only works with public ChatGPT share links
- ChatGPT may change their HTML structure, which could break parsing
- Rate limiting may apply for multiple requests
- Timestamps are not available in share links (approximated)

## Deployment

This app is optimized for deployment on Cloudflare Pages. See the [deployment guide](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Cloudflare Pages

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Use build command: `npm run pages:build`
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
