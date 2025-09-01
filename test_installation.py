#!/usr/bin/env python3
"""
Test script to verify the ChatGPT Share Parser installation.
"""

import sys
from pathlib import Path

def test_imports():
    """Test if all required modules can be imported."""
    print("🧪 Testing imports...")
    
    try:
        import streamlit
        print(f"✅ Streamlit {streamlit.__version__}")
    except ImportError as e:
        print(f"❌ Streamlit import failed: {e}")
        return False
    
    try:
        import pandas
        print(f"✅ Pandas {pandas.__version__}")
    except ImportError as e:
        print(f"❌ Pandas import failed: {e}")
        return False
    
    try:
        import bs4
        print(f"✅ BeautifulSoup {bs4.__version__}")
    except ImportError as e:
        print(f"❌ BeautifulSoup import failed: {e}")
        return False
    
    try:
        import playwright
        # Playwright doesn't have __version__ attribute
        print("✅ Playwright")
    except ImportError as e:
        print(f"❌ Playwright import failed: {e}")
        return False
    
    try:
        import html2text
        print(f"✅ HTML2Text")
    except ImportError as e:
        print(f"❌ HTML2Text import failed: {e}")
        return False
    
    try:
        import slugify
        print(f"✅ Python Slugify")
    except ImportError as e:
        print(f"❌ Python Slugify import failed: {e}")
        return False
    
    return True

def test_app_imports():
    """Test if the app modules can be imported."""
    print("\n🧪 Testing app imports...")
    
    try:
        from src.parser import ChatGPTShareParser
        print("✅ Parser module imported successfully")
    except ImportError as e:
        print(f"❌ Parser module import failed: {e}")
        return False
    
    try:
        from src.utils import validate_url, clean_whitespace
        print("✅ Utils module imported successfully")
    except ImportError as e:
        print(f"❌ Utils module import failed: {e}")
        return False
    
    try:
        from src.ui_components import render_header
        print("✅ UI components module imported successfully")
    except ImportError as e:
        print(f"❌ UI components module import failed: {e}")
        return False
    
    try:
        from config import APP_NAME, APP_VERSION
        print(f"✅ Config module imported successfully ({APP_NAME} v{APP_VERSION})")
    except ImportError as e:
        print(f"❌ Config module import failed: {e}")
        return False
    
    return True

def test_playwright_browsers():
    """Test if Playwright browsers are installed."""
    print("\n🧪 Testing Playwright browsers...")
    
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # Try to launch a browser
            browser = p.chromium.launch(headless=True)
            browser.close()
            print("✅ Playwright browsers are working")
            return True
    except Exception as e:
        print(f"❌ Playwright browser test failed: {e}")
        print("💡 Run 'playwright install chromium' to install browsers")
        return False

def main():
    """Run all tests."""
    print("🚀 ChatGPT Share Parser - Installation Test")
    print("=" * 50)
    
    all_passed = True
    
    # Test basic imports
    if not test_imports():
        all_passed = False
    
    # Test app imports
    if not test_app_imports():
        all_passed = False
    
    # Test Playwright browsers
    if not test_playwright_browsers():
        all_passed = False
    
    print("\n" + "=" * 50)
    
    if all_passed:
        print("🎉 All tests passed! The app is ready to run.")
        print("💡 Run 'streamlit run app.py' to start the app.")
        print("💡 Or run 'python run.py' to use the launcher script.")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("💡 Check the error messages and install missing dependencies.")
        sys.exit(1)

if __name__ == "__main__":
    main()
