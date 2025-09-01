#!/usr/bin/env python3
"""
Parse a public ChatGPT share link and export the conversation as a CSV.

Usage:
  python chatgpt_share_to_csv.py "https://chatgpt.com/share/<id>"

Output:
  exports/YYYY/YYYY-MM/YYYYMMDD_HHMM_chatgpt_share_<id>.csv
"""

import argparse
import datetime as dt
import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Optional
from html import unescape

import pandas as pd
from bs4 import BeautifulSoup
from slugify import slugify
from html2text import HTML2Text
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout


# ----------------------------
# Utilities
# ----------------------------

def ensure_export_path(now: Optional[dt.datetime] = None) -> Path:
    if now is None:
        now = dt.datetime.now()
    base = Path("exports") / f"{now:%Y}" / f"{now:%Y-%m}"
    base.mkdir(parents=True, exist_ok=True)
    return base


def derive_share_id(url: str) -> str:
    m = re.search(r"/share/([a-f0-9\-]{36})", url)
    if m:
        return m.group(1)
    return slugify(url)


def html_to_markdown(html: str) -> str:
    h = HTML2Text()
    h.ignore_images = False
    h.ignore_emphasis = False
    h.body_width = 0
    h.wrap_links = False
    return h.handle(html).strip()


def clean_whitespace(s: str) -> str:
    return re.sub(r"[ \t]+", " ", s).replace("\xa0", " ").strip()


def extract_code_fences(markdown_text: str) -> List[str]:
    fences = re.findall(r"```(?:[^\n]*\n)?(.*?)```", markdown_text, flags=re.DOTALL)
    return [f.strip() for f in fences]


def extract_links_and_images(body) -> Dict[str, str]:
    links = [a.get("href") for a in body.find_all("a", href=True)]
    images = [img.get("src") for img in body.find_all("img", src=True)]
    return {
        "links": " |SEP| ".join(links),
        "images": " |SEP| ".join(images),
    }


# ----------------------------
# Fetch page
# ----------------------------

def scrape_share_page(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto(url, timeout=30000)
        except PWTimeout:
            print("[WARN] Navigation timeout. Retrying without strict wait...", file=sys.stderr)
            page.goto(url, wait_until="domcontentloaded")

        try:
            page.wait_for_selector('[data-message-author-role]', timeout=15000)
        except Exception:
            # fallback: wait a little in case of slow hydration
            page.wait_for_timeout(8000)

        html = page.content()
        browser.close()
        return html


# ----------------------------
# DOM parser
# ----------------------------

def parse_messages_from_html(html: str) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    msg_nodes = soup.select('[data-message-author-role]')
    if not msg_nodes:
        msg_nodes = soup.select('article')

    results = []
    turn_idx = 1

    for node in msg_nodes:
        role = node.get("data-message-author-role")
        if role is None:
            txt = node.get_text(" ", strip=True).lower()
            if "assistant" in txt and len(txt) < 32:
                role = "assistant"
            elif "user" in txt and len(txt) < 32:
                role = "user"
            else:
                role = "assistant"

        body = None
        for sel in [
            '[data-testid="markdown"]',
            '[data-message-author-role-content]',
            'div[class*="markdown"]',
            'div[class*="prose"]',
            'div'
        ]:
            body = node.select_one(sel)
            if body:
                break
        if body is None:
            body = node

        html_body = str(body)
        md_body = html_to_markdown(html_body)
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

    cleaned = [r for r in results if r["text"] or r["markdown"]]
    deduped = []
    seen = set()
    for r in cleaned:
        key = (r["role"], r["text"], r["markdown"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    return deduped


# ----------------------------
# Stream payload parser (fallback)
# ----------------------------

STREAM_SENTINEL = "window.__reactRouterContext.streamController.enqueue("

def parse_messages_from_stream_html(html: str) -> List[Dict]:
    if STREAM_SENTINEL not in html:
        return []

    payloads = []
    start = 0
    while True:
        i = html.find(STREAM_SENTINEL, start)
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

    stream_text = unescape("".join(payloads))

    msg_pat = re.compile(
        r'"role","(assistant|user|system)".{0,2000}?"content_type","text","parts",\[(.*?)\]',
        re.DOTALL
    )

    rows = []
    turn = 1
    for m in msg_pat.finditer(stream_text):
        role = m.group(1)
        parts_blob = "[" + m.group(2).strip() + "]"

        def safe_parse_parts(src: str):
            try:
                data = json.loads(src)
                if isinstance(data, list):
                    return [str(x) for x in data if isinstance(x, str)]
            except Exception:
                pass
            rough = re.findall(r'"((?:[^"\\]|\\.)*)"', src)
            return [bytes(s, "utf-8").decode("unicode_escape") for s in rough]

        parts = safe_parse_parts(parts_blob)
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

    deduped = []
    for r in rows:
        if deduped and r["role"] == deduped[-1]["role"] and r["text"] == deduped[-1]["text"]:
            continue
        deduped.append(r)

    return deduped


# ----------------------------
# Export
# ----------------------------

def export_csv(rows: List[Dict], share_url: str, now: Optional[dt.datetime] = None) -> Path:
    if now is None:
        now = dt.datetime.now()

    share_id = derive_share_id(share_url)
    out_dir = ensure_export_path(now)
    out_name = f"{now:%Y%m%d_%H%M}_chatgpt_share_{share_id}.csv"
    out_path = out_dir / out_name

    df = pd.DataFrame(rows, columns=[
        "turn", "role", "text", "markdown", "code_blocks", "links", "images", "raw_html"
    ])
    df.sort_values("turn", inplace=True)
    df.to_csv(out_path, index=False, encoding="utf-8")

    return out_path


# ----------------------------
# Main
# ----------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("share_url", help="ChatGPT share URL")
    args = ap.parse_args()

    print(f"[INFO] Fetching: {args.share_url}")
    html = scrape_share_page(args.share_url)

    print(f"[INFO] Parsing DOM…")
    rows = parse_messages_from_html(html)

    if not rows:
        print("[WARN] No DOM messages found, trying stream parser…")
        rows = parse_messages_from_stream_html(html)

    if not rows:
        print("[ERROR] No messages extracted. Page structure may have changed or the link is not public.", file=sys.stderr)
        sys.exit(2)

    out = export_csv(rows, args.share_url)
    print(f"[OK] Wrote {len(rows)} rows -> {out}")


if __name__ == "__main__":
    main()
