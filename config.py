#!/usr/bin/env python3
"""
Configuration file for the ChatGPT Share Parser Streamlit App.
"""

import os
from pathlib import Path

# App Configuration
APP_NAME = "ChatGPT Share Parser"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Parse and export ChatGPT conversations from public share links"

# Page Configuration
PAGE_TITLE = "ChatGPT Share Parser"
PAGE_ICON = "💬"
LAYOUT = "wide"
INITIAL_SIDEBAR_STATE = "collapsed"

# Playwright Configuration
PLAYWRIGHT_TIMEOUT = 30000  # 30 seconds
PLAYWRIGHT_SELECTOR_TIMEOUT = 15000  # 15 seconds
PLAYWRIGHT_FALLBACK_TIMEOUT = 8000  # 8 seconds

# UI Configuration
MAX_TEXT_LENGTH = 100
MAX_DISPLAY_LENGTH = 150
TEXT_AREA_MIN_HEIGHT = 100
TEXT_AREA_MAX_HEIGHT = 200

# File Export Configuration
EXPORT_DIR = Path("exports")
CSV_ENCODING = "utf-8"
JSON_INDENT = 2

# URL Validation
CHATGPT_SHARE_PATTERN = r"https?://(?:www\.)?chatgpt\.com/share/[a-f0-9\-]{36}"

# CSS Classes
CSS_CLASSES = {
    "main_header": "main-header",
    "success_box": "success-box",
    "info_box": "info-box",
    "button": "stButton > button"
}

# Gradient Colors
GRADIENTS = {
    "primary": "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    "success": "linear-gradient(90deg, #56ab2f 0%, #a8e6cf 100%)",
    "info": "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)"
}

# Environment Variables
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
