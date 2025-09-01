# 💬 ChatGPT Share Parser

<img width="1774" height="596" alt="Screenshot 2025-09-01 at 17 04 56" src="https://github.com/user-attachments/assets/bf2d4f68-9ebb-414d-aedb-34e1be3ad270" />
<img width="1834" height="774" alt="Screenshot 2025-09-01 at 17 05 24" src="https://github.com/user-attachments/assets/8b8ceb7f-a2f3-4bf2-8883-4b6396034d4d" />


A modern, modular Streamlit web application for parsing ChatGPT share links and exporting conversations as CSV or JSON files. This app was created with the help of ChatGPT and is still in development.

## ✨ Features

- **Modern Web Interface**: Beautiful, responsive Streamlit UI with gradient designs
- **Smart Parsing**: Intelligent parsing of ChatGPT share pages with fallback methods
- **Multiple Export Formats**: Download conversations as CSV or JSON
- **Rich Data Extraction**: Captures text, markdown, code blocks, links, and images
- **Real-time Validation**: URL validation and parsing status feedback
- **Modular Architecture**: Clean, maintainable code following industry best practices

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dj-urg/chat-gpt-parser
   cd Chat_GPT_Chat_Parser
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Playwright browsers**
   ```bash
   playwright install chromium
   ```

4. **Run the Streamlit app**
   ```bash
   streamlit run app.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:8501`

## 📖 Usage

1. **Copy a ChatGPT share link** from a public conversation
2. **Paste the URL** in the input field
3. **Click "Parse ChatGPT Share"** to extract the conversation
4. **Download your data** as CSV or JSON
5. **View the conversation** in the interactive preview

## 🏗️ Architecture

The application follows a modular, layered architecture:

```
Chat_GPT_Chat_Parser/
├── app.py                 # Main Streamlit application entry point
├── config.py             # Configuration and constants
├── requirements.txt      # Python dependencies
├── README.md            # Project documentation
├── src/                 # Source code package
│   ├── __init__.py      # Package initialization
│   ├── parser.py        # Core parsing logic
│   ├── utils.py         # Utility functions
│   └── ui_components.py # UI rendering components
└── exports/             # Generated export files
    └── YYYY/
        └── YYYY-MM/
```

### Core Components

- **`app.py`**: Main application orchestrator and UI layout
- **`src/parser.py`**: `ChatGPTShareParser` class handling all parsing logic
- **`src/utils.py`**: Helper functions for text processing and validation
- **`src/ui_components.py`**: Modular UI components for different sections
- **`config.py`**: Centralized configuration management

## 🔧 Configuration

Key configuration options in `config.py`:

- **Playwright timeouts**: Adjust scraping timeouts for different network conditions
- **UI settings**: Customize display parameters and styling
- **Export options**: Configure file formats and encoding
- **Environment variables**: Set debug mode and log levels

## 🎨 Customization

### Styling

The app uses custom CSS with gradient backgrounds and modern styling. Modify the CSS in `app.py` or create a separate stylesheet.

### Export Formats

Add new export formats by extending the `ChatGPTShareParser.export_to_*` methods and updating the UI components.

### Parsing Logic

Extend the parser to handle additional ChatGPT page structures by modifying the `_parse_messages_from_html` method.

## 🐛 Troubleshooting

### Common Issues

1. **Playwright Installation**
   ```bash
   playwright install chromium
   playwright install-deps
   ```

2. **Timeout Errors**
   - Increase timeout values in `config.py`
   - Check network connectivity
   - Verify the share link is public and accessible

3. **Parsing Failures**
   - Ensure the link is a valid ChatGPT share URL
   - Check if the conversation is publicly accessible
   - Try refreshing the page or using a different browser

### Debug Mode

Enable debug mode by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
streamlit run app.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Streamlit** for the amazing web app framework
- **Playwright** for robust web scraping capabilities
- **BeautifulSoup** for HTML parsing
- **Pandas** for data manipulation and export

## 📞 Support

For questions, issues, or feature requests:

1. Check the troubleshooting section above
2. Search existing issues
3. Create a new issue with detailed information
4. Include error messages and reproduction steps

---

**Made with ❤️ for the ChatGPT community**
