#!/usr/bin/env python3
"""
ChatGPT Share Parser Module
Handles the core logic for parsing ChatGPT share links and extracting conversation data.
"""

import re
import json
from typing import List, Dict, Optional
from html import unescape
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup
from slugify import slugify
from html2text import HTML2Text
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

from .utils import clean_whitespace, extract_code_fences, extract_links_and_images


class ChatGPTShareParser:
    """Main parser class for ChatGPT share links."""
    
    def __init__(self):
        """Initialize the parser."""
        self.html_converter = self._setup_html_converter()
    
    def _setup_html_converter(self) -> HTML2Text:
        """Setup HTML to Markdown converter with optimal settings."""
        h = HTML2Text()
        h.ignore_images = False
        h.ignore_emphasis = False
        h.body_width = 0
        h.wrap_links = False
        return h
    
    def parse_share_url(self, url: str) -> List[Dict]:
        """
        Parse a ChatGPT share URL and return conversation data.
        
        Args:
            url: The ChatGPT share URL to parse
            
        Returns:
            List of message dictionaries with conversation data
        """
        # Fetch the HTML content
        html = self._scrape_share_page(url)
        
        # Try parsing with DOM parser first
        messages = self._parse_messages_from_html(html)
        
        # Fallback to stream parser if DOM parser fails
        if not messages:
            messages = self._parse_messages_from_stream_html(html)
        
        return messages
    
    def _scrape_share_page(self, url: str) -> str:
        """
        Scrape the HTML content from a ChatGPT share page.
        
        Args:
            url: The URL to scrape
            
        Returns:
            HTML content as string
        """
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                page.goto(url, timeout=30000)
            except PWTimeout:
                # Fallback to less strict waiting
                page.goto(url, wait_until="domcontentloaded")
            
            try:
                page.wait_for_selector('[data-message-author-role]', timeout=15000)
            except Exception:
                # Fallback: wait a little in case of slow hydration
                page.wait_for_timeout(8000)
            
            html = page.content()
            browser.close()
            return html
    
    def _parse_messages_from_html(self, html: str) -> List[Dict]:
        """
        Parse messages from HTML DOM structure.
        
        Args:
            html: HTML content to parse
            
        Returns:
            List of message dictionaries
        """
        soup = BeautifulSoup(html, "html.parser")
        msg_nodes = soup.select('[data-message-author-role]')
        
        if not msg_nodes:
            msg_nodes = soup.select('article')
        
        results = []
        turn_idx = 1
        
        for node in msg_nodes:
            role = self._extract_role(node)
            body = self._extract_message_body(node)
            
            if not body:
                continue
            
            html_body = str(body)
            md_body = self.html_converter.handle(html_body).strip()
            text_body = clean_whitespace(body.get_text(" ", strip=True))
            codes = extract_code_fences(md_body)
            extras = extract_links_and_images(body)
            
            results.append({
                "turn": turn_idx,
                "role": role,
                "text": text_body,
                "markdown": md_body,
                "code_blocks": " |SEP| ".join(codes) if codes else "",
                "links": extras["links"],
                "images": extras["images"],
                "raw_html": html_body,
            })
            turn_idx += 1
        
        # Clean and deduplicate results
        cleaned = [r for r in results if r["text"] or r["markdown"]]
        return self._deduplicate_messages(cleaned)
    
    def _extract_role(self, node) -> str:
        """Extract the role (user/assistant) from a message node."""
        role = node.get("data-message-author-role")
        if role:
            return role
        
        # Fallback role detection
        txt = node.get_text(" ", strip=True).lower()
        if "assistant" in txt and len(txt) < 32:
            return "assistant"
        elif "user" in txt and len(txt) < 32:
            return "user"
        else:
            return "assistant"
    
    def _extract_message_body(self, node) -> Optional:
        """Extract the message body content from a node."""
        for selector in [
            '[data-testid="markdown"]',
            '[data-message-author-role-content]',
            'div[class*="markdown"]',
            'div[class*="prose"]',
            'div'
        ]:
            body = node.select_one(selector)
            if body:
                return body
        return node
    
    def _deduplicate_messages(self, messages: List[Dict]) -> List[Dict]:
        """Remove duplicate messages based on role, text, and markdown."""
        deduped = []
        seen = set()
        
        for msg in messages:
            key = (msg["role"], msg["text"], msg["markdown"])
            if key in seen:
                continue
            seen.add(key)
            deduped.append(msg)
        
        return deduped
    
    def _parse_messages_from_stream_html(self, html: str) -> List[Dict]:
        """
        Parse messages from stream HTML as fallback method.
        
        Args:
            html: HTML content to parse
            
        Returns:
            List of message dictionaries
        """
        stream_sentinel = "window.__reactRouterContext.streamController.enqueue("
        
        if stream_sentinel not in html:
            return []
        
        payloads = self._extract_stream_payloads(html, stream_sentinel)
        stream_text = unescape("".join(payloads))
        
        return self._parse_stream_messages(stream_text)
    
    def _extract_stream_payloads(self, html: str, sentinel: str) -> List[str]:
        """Extract stream payloads from HTML."""
        payloads = []
        start = 0
        
        while True:
            i = html.find(sentinel, start)
            if i == -1:
                break
            
            j = html.find(");", i)
            if j == -1:
                break
            
            inner = html[i:j]
            q1 = inner.find("(")
            frag = inner[q1+1:].strip()
            frag = frag.strip("'\"").rstrip(")")
            payloads.append(frag)
            start = j + 2
        
        return payloads
    
    def _parse_stream_messages(self, stream_text: str) -> List[Dict]:
        """Parse messages from stream text."""
        msg_pattern = re.compile(
            r'"role","(assistant|user|system)".{0,2000}?"content_type","text","parts",\[(.*?)\]',
            re.DOTALL
        )
        
        rows = []
        turn = 1
        
        for match in msg_pattern.finditer(stream_text):
            role = match.group(1)
            parts_blob = "[" + match.group(2).strip() + "]"
            
            parts = self._safe_parse_parts(parts_blob)
            text = "\n\n".join(p.strip() for p in parts if p.strip())
            
            if not text:
                continue
            
            rows.append({
                "turn": turn,
                "role": role,
                "text": text,
                "markdown": text,
                "code_blocks": " |SEP| ".join(extract_code_fences(text)),
                "links": "",
                "images": "",
                "raw_html": "",
            })
            turn += 1
        
        return self._deduplicate_stream_messages(rows)
    
    def _safe_parse_parts(self, src: str) -> List[str]:
        """Safely parse parts from stream data."""
        try:
            data = json.loads(src)
            if isinstance(data, list):
                return [str(x) for x in data if isinstance(x, str)]
        except Exception:
            pass
        
        # Fallback regex parsing
        rough = re.findall(r'"((?:[^"\\]|\\.)*)"', src)
        return [bytes(s, "utf-8").decode("unicode_escape") for s in rough]
    
    def _deduplicate_stream_messages(self, messages: List[Dict]) -> List[Dict]:
        """Remove duplicate stream messages."""
        deduped = []
        
        for msg in messages:
            if (deduped and 
                msg["role"] == deduped[-1]["role"] and 
                msg["text"] == deduped[-1]["text"]):
                continue
            deduped.append(msg)
        
        return deduped
    
    def export_to_csv(self, messages: List[Dict], share_url: str) -> str:
        """
        Export messages to CSV format.
        
        Args:
            messages: List of message dictionaries
            share_url: Original share URL
            
        Returns:
            CSV content as string
        """
        df = pd.DataFrame(messages, columns=[
            "turn", "role", "text", "markdown", "code_blocks", 
            "links", "images", "raw_html"
        ])
        df.sort_values("turn", inplace=True)
        
        return df.to_csv(index=False, encoding="utf-8")
