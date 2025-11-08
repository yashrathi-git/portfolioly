"""
Contact section parser for LinkedIn profiles.

This module extracts contact information from the Contact section,
including email, phone, and various platform URLs (LinkedIn, GitHub, etc.).
"""

import re
from typing import Dict, Optional
from urllib.parse import urlparse


_HOST_PLATFORM_MAP = {
    "linkedin.com": "LinkedIn",
    "github.com": "GitHub",
    "gitlab.com": "GitLab",
    "bitbucket.org": "Bitbucket",
    "leetcode.com": "LeetCode",
    "leetcode.cn": "LeetCode",
    "codeforces.com": "Codeforces",
    "codechef.com": "CodeChef",
    "hackerrank.com": "HackerRank",
    "hackerearth.com": "HackerEarth",
    "dev.to": "Dev.to",
    "medium.com": "Medium",
    "substack.com": "Substack",
    "hashnode.com": "Hashnode",
    "behance.net": "Behance",
    "dribbble.com": "Dribbble",
    "kaggle.com": "Kaggle",
    "angel.co": "AngelList",
    "twitter.com": "Twitter",
    "x.com": "Twitter",
    "facebook.com": "Facebook",
    "instagram.com": "Instagram",
    "youtube.com": "YouTube",
    "t.me": "Telegram",
    "telegram.me": "Telegram",
    "notion.so": "Notion",
    "notion.site": "Notion",
    "cal.com": "Cal.com",
    "gumroad.com": "Gumroad",
    "patreon.com": "Patreon",
}


def _platform_from_host(url: str) -> Optional[str]:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if not host:
        return None
    for token, platform in _HOST_PLATFORM_MAP.items():
        if token in host:
            return platform
    return None


def parse_contact_section(raw_text: str) -> Dict[str, str]:
    """
    Parse contact section into structured dictionary.

    Extracts email addresses, phone numbers, and platform URLs from the
    Contact section. Platform labels are extracted from parentheses or
    inferred from domain names.

    Args:
        raw_text: Raw text from the Contact section

    Returns:
        Dictionary mapping contact types to values:
        {
            "email": "user@example.com",
            "phone": "1234567890",
            "LinkedIn": "https://linkedin.com/in/username",
            "GitHub": "https://github.com/username",
            "Personal": "https://example.com",
            ...
        }

    Example:
        Input:
            '''
            [email@example.com](mailto:email@example.com)
            1234567890 (Mobile)
            [linkedin.com/in/user (LinkedIn)](https://linkedin.com/in/user)
            [github.com/user (GitHub)](https://github.com/user)
            '''
        Output:
            {
                "email": "email@example.com",
                "phone": "1234567890",
                "LinkedIn": "https://linkedin.com/in/user",
                "GitHub": "https://github.com/user"
            }
    """
    if not raw_text or not raw_text.strip():
        return {}

    contact_info = {}

    # Split into lines for processing
    # Don't use normalize_before_h1_text here because each line is a separate contact item
    lines = raw_text.split("\n")

    # Track the last URL for cases where label comes on next line
    last_url = None
    last_platform = None

    for line in lines:
        line = line.strip()
        if not line:
            # Empty line - if we have a pending URL, add it now
            if last_url and last_platform:
                contact_info[last_platform] = last_url
                last_url = None
                last_platform = None
            continue

        # Check if this line is just a label in parentheses (for previous URL)
        label_only = re.match(r"^\s*\(([^)]+)\)\s*$", line)
        if label_only and last_url:
            # This is a label for the previous URL - replace the inferred platform
            inferred_platform = _infer_platform_from_url(
                last_url, label_only.group(1).strip()
            )
            # Remove the old entry with inferred platform
            if last_platform in contact_info:
                del contact_info[last_platform]
            # Add with the explicit platform label
            contact_info[inferred_platform] = last_url
            last_url = None
            last_platform = None
            continue

        # Try to extract email
        email = _extract_email(line)
        if email:
            # Finalize any pending URL before adding email
            if last_url and last_platform:
                contact_info[last_platform] = last_url
                last_url = None
                last_platform = None
            contact_info["email"] = email
            continue

        # Try to extract phone
        phone_result = _extract_phone(line)
        if phone_result:
            # Finalize any pending URL before adding phone
            if last_url and last_platform:
                contact_info[last_platform] = last_url
                last_url = None
                last_platform = None
            contact_info["phone"] = phone_result
            continue

        # Try to extract platform URL
        platform_result = _extract_platform_url(line)
        if platform_result:
            platform, url = platform_result

            # Check if this URL was already added (label for previous URL)
            if last_url == url and last_platform:
                # This is a label for the previous URL - replace the old entry
                if last_platform in contact_info:
                    del contact_info[last_platform]
                contact_info[platform] = url
                last_url = None
                last_platform = None
            else:
                # Finalize any previous pending URL
                if last_url and last_platform:
                    contact_info[last_platform] = last_url

                # Store this URL - may be updated if next line has a label
                last_url = url
                last_platform = platform
                # Temporarily add to contact_info (may be removed/updated if next line has label)
                contact_info[platform] = url

    # Finalize any remaining pending URL
    if last_url and last_platform and last_platform not in contact_info:
        contact_info[last_platform] = last_url

    return contact_info


def _extract_email(line: str) -> Optional[str]:
    """
    Extract email address from a line.

    Handles both bare emails and mailto: links in markdown format.

    Args:
        line: Text line that may contain an email

    Returns:
        Email address if found, None otherwise
    """
    # Pattern for email addresses
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # Check for markdown mailto link: [email](mailto:email)
    mailto_match = re.search(r"\[([^\]]+)\]\(mailto:([^\)]+)\)", line)
    if mailto_match:
        # Return the email from the URL part (more reliable)
        return mailto_match.group(2).strip()

    # Check for bare email address
    email_match = re.search(email_pattern, line)
    if email_match:
        return email_match.group(0).strip()

    return None


def _extract_phone(line: str) -> Optional[str]:
    """
    Extract phone number from a line.

    Looks for phone numbers with optional labels like "(Mobile)" or "(Phone)".

    Args:
        line: Text line that may contain a phone number

    Returns:
        Phone number if found, None otherwise
    """
    # Look for phone with label pattern: "1234567890 (Mobile)"
    phone_with_label = re.search(r"^([\d\s\-]+)\s*\([^)]*\)\s*$", line)
    if phone_with_label:
        phone = phone_with_label.group(1).strip()
        # Clean up the phone number (remove spaces, dashes)
        phone_clean = re.sub(r"[\s\-]", "", phone)
        if len(phone_clean) >= 7 and phone_clean.isdigit():
            return phone_clean

    # Look for bare phone number (at least 7 digits)
    # Must not be part of a URL or email
    if "@" not in line and "http" not in line.lower():
        phone_match = re.search(r"\b(\d{7,})\b", line)
        if phone_match:
            return phone_match.group(1)

    return None


def _extract_platform_url(line: str) -> Optional[tuple[str, str]]:
    """
    Extract platform name and URL from a line.

    Handles:
    - Markdown links with platform labels: [url (Platform)](url)
    - Markdown links with platform labels on separate line: [url](url) followed by (Platform)
    - Bare URLs with domain-based platform inference

    Args:
        line: Text line that may contain a platform URL

    Returns:
        Tuple of (platform_name, url) if found, None otherwise
    """
    # Pattern 1: Markdown link with label in text: [text (Platform)](url)
    markdown_with_label = re.search(r"\[([^\]]+)\s*\(([^)]+)\)\]\(([^\)]+)\)", line)
    if markdown_with_label:
        label = markdown_with_label.group(2).strip()
        url = markdown_with_label.group(3).strip()
        platform = _infer_platform_from_url(url, label)
        return (platform, url)

    # Pattern 2: Markdown link followed by label: [text](url) (Platform)
    markdown_then_label = re.search(r"\[([^\]]+)\]\(([^\)]+)\)\s*\(([^)]+)\)", line)
    if markdown_then_label:
        label = markdown_then_label.group(3).strip()
        url = markdown_then_label.group(2).strip()
        platform = _infer_platform_from_url(url, label)
        return (platform, url)

    # Pattern 3: Just label in parentheses (URL was on previous line, already processed)
    # This handles cases where URL and label are on separate lines
    if re.match(r"^\s*\([^)]+\)\s*$", line):
        # This is just a label line, skip it (URL should have been captured already)
        return None

    # Pattern 4: Markdown link without label - infer platform from domain
    markdown_link = re.search(r"\[([^\]]+)\]\(([^\)]+)\)", line)
    if markdown_link:
        text = markdown_link.group(1).strip()
        url = markdown_link.group(2).strip()

        # Check if the text is just a label in parentheses like "(Blog)"
        # This indicates it's a label for a previous URL
        if re.match(r"^\(([^)]+)\)$", text):
            # Extract the label
            label_match = re.match(r"^\(([^)]+)\)$", text)
            if label_match:
                label = label_match.group(1).strip()
                platform = _infer_platform_from_url(url, label)
                return (platform, url)

        # Otherwise, infer platform from domain
        platform = _infer_platform_from_url(url)
        return (platform, url)

    # Pattern 5: Bare URL - infer platform from domain
    url_pattern = r"https?://[^\s]+"
    url_match = re.search(url_pattern, line)
    if url_match:
        url = url_match.group(0).strip()
        platform = _infer_platform_from_url(url)
        return (platform, url)

    return None


def _infer_platform_from_url(url: str, label: Optional[str] = None) -> str:
    """
    Infer platform name from URL domain.

    Args:
        url: URL string

    Returns:
        Platform name (e.g., "LinkedIn", "GitHub", "Personal")
    """
    platform = _platform_from_host(url)
    if platform:
        return platform

    if label:
        return label

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host:
        if host.startswith("www."):
            host = host[4:]
        if host.count(".") == 1:
            return "Personal"
        return host

    return "Personal"


__all__ = ["parse_contact_section"]
