# ChatGPT Conversation Parser

A Next.js application that allows users to parse ChatGPT conversation share links and export them as CSV files.

## Features

- 🔗 Parse ChatGPT public share links
- 📊 Export conversations as CSV format
- 👀 Preview conversations in a clean UI
- 💾 Download CSV files directly
- 📋 Copy CSV content to clipboard
- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Fast parsing with server-side processing

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
3. Click "Parse & Generate CSV"
4. Preview the conversation and download the CSV file

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
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant", 
      "content": "I'm doing well, thank you!",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "csv": "Message Number,Role,Content,Timestamp\n1,user,Hello how are you?,2024-01-01T00:00:00.000Z\n2,assistant,I'm doing well thank you!,2024-01-01T00:00:00.000Z",
  "messageCount": 2
}
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Cheerio** - HTML parsing
- **csv-stringify** - CSV generation
- **Lucide React** - Icons

## Limitations

- Only works with public ChatGPT share links
- ChatGPT may change their HTML structure, which could break parsing
- Rate limiting may apply for multiple requests
- Timestamps are not available in share links (approximated)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
