#!/usr/bin/env python3
"""
Launcher script for the ChatGPT Share Parser Streamlit App.
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Launch the Streamlit app with proper configuration."""
    
    # Check if we're in the right directory
    if not Path("app.py").exists():
        print("❌ Error: app.py not found. Please run this script from the project root directory.")
        sys.exit(1)
    
    # Check if requirements are installed
    try:
        import streamlit
        import pandas
        import playwright
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install requirements first: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check if Playwright browsers are installed
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # This will fail if browsers aren't installed
            pass
    except Exception:
        print("⚠️  Playwright browsers not installed. Installing now...")
        try:
            subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
            print("✅ Playwright browsers installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Playwright browsers.")
            print("Please run manually: playwright install chromium")
            sys.exit(1)
    
    print("🚀 Launching ChatGPT Share Parser...")
    print("📱 The app will open in your default browser.")
    print("🔗 If it doesn't open automatically, navigate to: http://localhost:8501")
    print("⏹️  Press Ctrl+C to stop the app.")
    print()
    
    # Launch Streamlit
    try:
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "app.py",
            "--server.port", "8501",
            "--server.address", "localhost"
        ])
    except KeyboardInterrupt:
        print("\n👋 App stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error launching app: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
