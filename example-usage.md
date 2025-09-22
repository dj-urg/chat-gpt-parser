# Example Usage

## Testing the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the application:**
   Navigate to `http://localhost:3000` in your browser.

3. **Test with a ChatGPT share link:**
   - Go to ChatGPT and start a conversation
   - Click the share button to get a public link
   - Copy the link (e.g., `https://chatgpt.com/share/68d1449d-2328-800b-8715-43f6696bfb19`)
   - Paste it into the input field
   - Click "Parse & Generate CSV"

## Expected Output

The application will:
- Parse the conversation messages
- Display them in a preview format
- Generate a CSV with columns: Message Number, Role, Content, Timestamp
- Allow you to download the CSV file
- Provide a copy-to-clipboard option

## Sample CSV Output

```csv
Message Number,Role,Content,Timestamp
1,user,Hello! How can you help me today?,2024-01-01T00:00:00.000Z
2,assistant,I'd be happy to help you! I can assist with a wide variety of tasks including answering questions, helping with writing, coding, analysis, and much more. What would you like to work on?,2024-01-01T00:00:00.000Z
3,user,Can you help me write a Python function?,2024-01-01T00:00:00.000Z
4,assistant,Of course! I'd be happy to help you write a Python function. What kind of function do you need? Please let me know what the function should do, and I can help you write it with proper syntax and best practices.,2024-01-01T00:00:00.000Z
```

## Troubleshooting

### Common Issues

1. **"No conversation messages found"**
   - The conversation might be private
   - The URL format might have changed
   - Try with a different conversation link

2. **"Failed to fetch conversation"**
   - Check your internet connection
   - Verify the URL is correct
   - The conversation might have been deleted

3. **Parsing errors**
   - ChatGPT may have updated their page structure
   - Try refreshing and parsing again
   - Some conversations might have complex formatting

### Debug Mode

To see what's being parsed, check the browser's developer console for any error messages or network requests.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS
- Google Cloud Platform
