#!/usr/bin/env python3
"""
UI Components for the ChatGPT Share Parser Streamlit App.
"""

import streamlit as st
import pandas as pd
from datetime import datetime
from typing import List, Dict

from .utils import derive_share_id, truncate_text


def render_header():
    """Render the main header section."""
    st.markdown("""
        <div class="main-header">
            <h1>💬 ChatGPT Share Parser</h1>
            <p>Parse and export ChatGPT conversations from public share links</p>
        </div>
    """, unsafe_allow_html=True)


def render_input_section():
    """Render the input section for URL entry."""
    st.markdown("### 🔗 Enter ChatGPT Share Link")
    
    # URL input with validation
    url_input = st.text_input(
        "ChatGPT Share URL",
        placeholder="https://chatgpt.com/share/your-share-id-here",
        help="Paste a public ChatGPT share link here",
        key="url_input"
    )
    
    # Store URL in session state
    if url_input:
        st.session_state.share_url = url_input.strip()
    
    # Show URL validation status
    if st.session_state.share_url:
        if st.session_state.share_url.startswith("https://chatgpt.com/share/"):
            st.success("✅ Valid ChatGPT share URL detected")
        else:
            st.warning("⚠️ Please enter a valid ChatGPT share URL")


def render_results_section(messages: List[Dict]):
    """Render the results section with data display and download options."""
    st.markdown("---")
    st.markdown("### 📊 Parsed Conversation")
    
    # Summary statistics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Messages", len(messages))
    
    with col2:
        user_messages = len([m for m in messages if m["role"] == "user"])
        st.metric("User Messages", user_messages)
    
    with col3:
        assistant_messages = len([m for m in messages if m["role"] == "assistant"])
        st.metric("Assistant Messages", assistant_messages)
    
    with col4:
        total_chars = sum(len(m.get("text", "")) for m in messages)
        st.metric("Total Characters", f"{total_chars:,}")
    
    # Download section
    st.markdown("### 💾 Download Options")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # CSV download
        csv_data = _prepare_csv_data(messages)
        csv_filename = _generate_csv_filename()
        
        st.download_button(
            label="📥 Download CSV",
            data=csv_data,
            file_name=csv_filename,
            mime="text/csv",
            help="Download the conversation as a CSV file"
        )
    
    with col2:
        # JSON download
        json_data = _prepare_json_data(messages)
        json_filename = _generate_json_filename()
        
        st.download_button(
            label="📥 Download JSON",
            data=json_data,
            file_name=json_filename,
            mime="application/json",
            help="Download the conversation as a JSON file"
        )
    
    # Data preview
    st.markdown("### 👀 Conversation Preview")
    
    # Create a clean DataFrame for display
    display_df = _create_display_dataframe(messages)
    
    # Show the data in an expandable section
    with st.expander("📋 View Full Conversation Data", expanded=False):
        st.dataframe(display_df, width='stretch')
    
    # Show individual messages in a more readable format
    st.markdown("### 💭 Message Details")
    
    for i, message in enumerate(messages):
        role_icon = "👤" if message["role"] == "user" else "🤖"
        role_color = "blue" if message["role"] == "user" else "green"
        
        with st.container():
            st.markdown(f"**{role_icon} {message['role'].title()} (Turn {message['turn']})**")
            
            # Message content
            if message.get("text"):
                st.text_area(
                    "Message Content",
                    value=message["text"],
                    height=min(200, max(100, len(message["text"]) // 2)),
                    key=f"msg_{i}",
                    disabled=True
                )
            
            # Show additional details in expandable sections
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if message.get("code_blocks"):
                    with st.expander("💻 Code Blocks"):
                        code_blocks = message["code_blocks"].split(" |SEP| ")
                        for j, code in enumerate(code_blocks):
                            if code.strip():
                                st.code(code, language="text")
            
            with col2:
                if message.get("links"):
                    with st.expander("🔗 Links"):
                        links = message["links"].split(" |SEP| ")
                        for link in links:
                            if link.strip():
                                st.write(f"• [{link}]({link})")
            
            with col3:
                if message.get("images"):
                    with st.expander("🖼️ Images"):
                        images = message["images"].split(" |SEP| ")
                        for img in images:
                            if img.strip():
                                st.image(img, caption="Shared image", use_column_width=True)
            
            st.markdown("---")


def _prepare_csv_data(messages: List[Dict]) -> str:
    """Prepare CSV data for download."""
    df = pd.DataFrame(messages)
    return df.to_csv(index=False, encoding="utf-8")


def _prepare_json_data(messages: List[Dict]) -> str:
    """Prepare JSON data for download."""
    import json
    return json.dumps(messages, indent=2, ensure_ascii=False)


def _generate_csv_filename() -> str:
    """Generate a filename for CSV download."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return f"chatgpt_conversation_{timestamp}.csv"


def _generate_json_filename() -> str:
    """Generate a filename for JSON download."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return f"chatgpt_conversation_{timestamp}.json"


def _create_display_dataframe(messages: List[Dict]) -> pd.DataFrame:
    """Create a clean DataFrame for display purposes."""
    display_data = []
    
    for msg in messages:
        display_data.append({
            "Turn": msg["turn"],
            "Role": msg["role"].title(),
            "Text": truncate_text(msg.get("text", ""), 150),
            "Code Blocks": "Yes" if msg.get("code_blocks") else "No",
            "Links": "Yes" if msg.get("links") else "No",
            "Images": "Yes" if msg.get("images") else "No"
        })
    
    return pd.DataFrame(display_data)
