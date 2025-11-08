"""
Profile type detection utility for social media and professional URLs.

This module provides utilities to automatically detect the type of social media
or professional profile from a URL, ensuring valid ProfileType values.
"""

import re
from typing import Optional
from urllib.parse import urlparse

from ..schemas.portfolio import ProfileType


# URL pattern matching for common platforms
PROFILE_PATTERNS = {
    ProfileType.LINKEDIN: [
        r"linkedin\.com",
        r"linkedin\.",
    ],
    ProfileType.GITHUB: [
        r"github\.com",
        r"github\.",
    ],
    ProfileType.TWITTER: [
        r"twitter\.com",
        r"x\.com",
        r"twitter\.",
    ],
    ProfileType.YOUTUBE: [
        r"youtube\.com",
        r"youtu\.be",
    ],
    ProfileType.SCHOLAR: [
        r"scholar\.google",
        r"research\.google",
    ],
    ProfileType.PORTFOLIO: [
        r"portfolio",
        r"portfol\.io",
    ],
}


def detect_profile_type(url: Optional[str]) -> ProfileType:
    """
    Detect the profile type from a URL.
    
    This function analyzes the URL and attempts to match it against known
    social media and professional platforms. Returns "other" for unrecognized URLs.
    
    Args:
        url: The URL to analyze
        
    Returns:
        ProfileType: The detected profile type, or ProfileType.OTHER if unrecognized
        
    Examples:
        >>> detect_profile_type("https://linkedin.com/in/johndoe")
        ProfileType.LINKEDIN
        >>> detect_profile_type("https://github.com/johndoe")
        ProfileType.GITHUB
        >>> detect_profile_type("https://example.com")
        ProfileType.OTHER
    """
    if not url or not isinstance(url, str):
        return ProfileType.OTHER
    
    url_lower = url.lower().strip()
    
    # Try to parse the URL to get the domain
    try:
        parsed = urlparse(url_lower)
        domain = parsed.netloc or parsed.path
    except Exception:
        domain = url_lower
    
    # Check against known patterns
    for profile_type, patterns in PROFILE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, domain, re.IGNORECASE):
                return profile_type
    
    # Check if it looks like a personal website
    if _is_personal_website(url_lower):
        return ProfileType.WEBSITE
    
    # Default to OTHER for unrecognized URLs
    return ProfileType.OTHER


def _is_personal_website(url: str) -> bool:
    """
    Heuristic to determine if a URL is likely a personal website.
    
    Args:
        url: The URL to check (already lowercased)
        
    Returns:
        bool: True if it appears to be a personal website
    """
    # Common personal website indicators
    personal_indicators = [
        r"\.me$",
        r"\.dev$",
        r"\.io$",
        r"\.xyz$",
        r"\.tech$",
    ]
    
    # Exclude common platforms
    platform_excludes = [
        "linkedin",
        "github",
        "twitter",
        "facebook",
        "instagram",
        "youtube",
        "medium",
        "behance",
        "dribbble",
    ]
    
    url_lower = url.lower()
    
    # If it contains platform names, it's not a personal website
    for platform in platform_excludes:
        if platform in url_lower:
            return False
    
    # Check for personal website TLDs
    for indicator in personal_indicators:
        if re.search(indicator, url_lower):
            return True
    
    # If it has a simple structure (no subdomain), might be personal
    try:
        parsed = urlparse(url_lower)
        domain = parsed.netloc or parsed.path
        # Simple domain without common platform patterns
        if domain and "." in domain:
            parts = domain.split(".")
            # Single domain name + TLD (e.g., "john.dev", "jane.com")
            if len(parts) == 2 and parts[0] != "www":
                return True
    except Exception:
        pass
    
    return False


def validate_and_fix_profile_type(
    profile_type: Optional[str],
    url: Optional[str] = None
) -> ProfileType:
    """
    Validate a profile type string and fix it if invalid.
    
    If the profile type is invalid or None, attempts to detect it from the URL.
    Always returns a valid ProfileType to prevent frontend errors.
    
    Args:
        profile_type: The profile type string to validate
        url: Optional URL to detect type from if profile_type is invalid
        
    Returns:
        ProfileType: A valid profile type
        
    Examples:
        >>> validate_and_fix_profile_type("linkedin")
        ProfileType.LINKEDIN
        >>> validate_and_fix_profile_type("invalid", "https://github.com/user")
        ProfileType.GITHUB
        >>> validate_and_fix_profile_type(None, "https://example.com")
        ProfileType.OTHER
    """
    # Try to match the provided type
    if profile_type:
        try:
            # Check if it's a valid enum value
            return ProfileType(profile_type.lower().strip())
        except (ValueError, AttributeError):
            pass
    
    # If type is invalid or missing, try to detect from URL
    if url:
        return detect_profile_type(url)
    
    # Default to OTHER
    return ProfileType.OTHER

