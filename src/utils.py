#!/usr/bin/env python3
"""
Utility functions for the ChatGPT Share Parser.
"""

import re
from typing import List, Dict
from bs4 import BeautifulSoup


def clean_whitespace(text: str) -> str:
    """
    Clean and normalize whitespace in text.
    
    Args:
        text: Input text to clean
        
    Returns:
        Cleaned text with normalized whitespace
    """
    if not text:
        return ""
    
    # Replace multiple spaces/tabs with single space
    cleaned = re.sub(r"[ \t]+", " ", text)
    # Replace non-breaking spaces with regular spaces
    cleaned = cleaned.replace("\xa0", " ")
    # Strip leading/trailing whitespace
    return cleaned.strip()


def extract_code_fences(markdown_text: str) -> List[str]:
    """
    Extract code blocks from markdown text.
    
    Args:
        markdown_text: Markdown text to parse
        
    Returns:
        List of code block contents
    """
    if not markdown_text:
        return []
    
    # Find all code fences (```...```)
    fences = re.findall(r"```(?:[^\n]*\n)?(.*?)```", markdown_text, flags=re.DOTALL)
    return [f.strip() for f in fences if f.strip()]


def extract_links_and_images(body) -> Dict[str, str]:
    """
    Extract links and images from HTML body.
    
    Args:
        body: BeautifulSoup body element
        
    Returns:
        Dictionary with 'links' and 'images' as pipe-separated strings
    """
    if not body:
        return {"links": "", "images": ""}
    
    # Extract all links
    links = []
    for a in body.find_all("a", href=True):
        href = a.get("href")
        if href and href.startswith(("http", "mailto:", "tel:")):
            links.append(href)
    
    # Extract all images
    images = []
    for img in body.find_all("img", src=True):
        src = img.get("src")
        if src:
            images.append(src)
    
    return {
        "links": " |SEP| ".join(links),
        "images": " |SEP| ".join(images),
    }


def validate_url(url: str) -> bool:
    """
    Validate if a URL is a valid ChatGPT share link.
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid ChatGPT share URL, False otherwise
    """
    if not url:
        return False
    
    # Check if it's a ChatGPT share URL
    chatgpt_pattern = r"https?://(?:www\.)?chatgpt\.com/share/[a-f0-9\-]{36}"
    return bool(re.match(chatgpt_pattern, url.strip()))


def derive_share_id(url: str) -> str:
    """
    Extract the share ID from a ChatGPT share URL.
    
    Args:
        url: ChatGPT share URL
        
    Returns:
        Share ID string
    """
    if not url:
        return ""
    
    # Extract the 36-character share ID
    match = re.search(r"/share/([a-f0-9\-]{36})", url)
    if match:
        return match.group(1)
    
    # Fallback: create a slug from the URL
    from slugify import slugify
    return slugify(url)


def format_timestamp(timestamp) -> str:
    """
    Format timestamp for display.
    
    Args:
        timestamp: Timestamp to format
        
    Returns:
        Formatted timestamp string
    """
    if hasattr(timestamp, 'strftime'):
        return timestamp.strftime("%Y-%m-%d %H:%M:%S")
    return str(timestamp)


def truncate_text(text: str, max_length: int = 100) -> str:
    """
    Truncate text to a maximum length with ellipsis.
    
    Args:
        text: Text to truncate
        max_length: Maximum length before truncation
        
    Returns:
        Truncated text with ellipsis if needed
    """
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length-3] + "..."


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing invalid characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for filesystem
    """
    if not filename:
        return "untitled"
    
    # Remove or replace invalid characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(' .')
    # Ensure it's not empty
    return sanitized if sanitized else "untitled"
