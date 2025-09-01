#!/usr/bin/env python3
"""
ChatGPT Share Parser - Streamlit App
A modern web interface for parsing ChatGPT share links and exporting conversations as CSV.
"""

import streamlit as st
import pandas as pd
from pathlib import Path
import tempfile
import os

from src.parser import ChatGPTShareParser
from src.utils import validate_url, format_timestamp
from src.ui_components import render_header, render_input_section, render_results_section
from config import (
    PAGE_TITLE, PAGE_ICON, LAYOUT, INITIAL_SIDEBAR_STATE,
    GRADIENTS, CSS_CLASSES
)


def main():
    """Main Streamlit application entry point."""
    
    # Page configuration
    st.set_page_config(
        page_title=PAGE_TITLE,
        page_icon=PAGE_ICON,
        layout=LAYOUT,
        initial_sidebar_state=INITIAL_SIDEBAR_STATE
    )
    
    # Custom CSS for modern styling
    st.markdown("""
        <style>
        .main-header {
            background: {GRADIENTS['primary']};
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            color: white;
            text-align: center;
        }
        .stButton > button {{
            background: {GRADIENTS['primary']};
            border: none;
            border-radius: 25px;
            color: white;
            padding: 0.5rem 2rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }}
        .stButton > button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }}
        .success-box {{
            background: {GRADIENTS['success']};
            padding: 1rem;
            border-radius: 10px;
            color: white;
            margin: 1rem 0;
        }}
        .info-box {{
            background: {GRADIENTS['info']};
            padding: 1rem;
            border-radius: 10px;
            color: white;
            margin: 1rem 0;
        }}
        </style>
    """, unsafe_allow_html=True)
    
    # Initialize session state
    if 'parsed_data' not in st.session_state:
        st.session_state.parsed_data = None
    if 'share_url' not in st.session_state:
        st.session_state.share_url = None
    if 'processing' not in st.session_state:
        st.session_state.processing = False
    
    # Render header
    render_header()
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Input section
        render_input_section()
        
        # Process button
        if st.button("🚀 Parse ChatGPT Share", type="primary", use_container_width=True):
            if st.session_state.share_url and validate_url(st.session_state.share_url):
                st.session_state.processing = True
                
                with st.spinner("🔄 Parsing ChatGPT share link..."):
                    try:
                        parser = ChatGPTShareParser()
                        data = parser.parse_share_url(st.session_state.share_url)
                        
                        if data and len(data) > 0:
                            st.session_state.parsed_data = data
                            st.success(f"✅ Successfully parsed {len(data)} messages!")
                        else:
                            st.error("❌ No messages found. Please check if the link is public and accessible.")
                            
                    except Exception as e:
                        st.error(f"❌ Error parsing share link: {str(e)}")
                    finally:
                        st.session_state.processing = False
            else:
                st.error("❌ Please enter a valid ChatGPT share URL")
    
    with col2:
        # Info sidebar
        st.markdown("""
        <div class="info-box">
        <h4>📋 How to use:</h4>
        <ol>
        <li>Copy a ChatGPT share link</li>
        <li>Paste it in the input field</li>
        <li>Click "Parse ChatGPT Share"</li>
        <li>Download your CSV file</li>
        </ol>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-box">
        <h4>💡 Tips:</h4>
        <ul>
        <li>Make sure the link is public</li>
        <li>Links should start with "https://chatgpt.com/share/"</li>
        <li>Large conversations may take longer to parse</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    # Results section
    if st.session_state.parsed_data:
        render_results_section(st.session_state.parsed_data)


if __name__ == "__main__":
    main()
