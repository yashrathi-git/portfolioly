"""
Tests for the profile type detection utility.

This module tests automatic profile type detection from URLs
and validation/fixing of invalid profile types.
"""

import pytest

from app.utils.profile_detector import (
    detect_profile_type,
    validate_and_fix_profile_type,
)
from app.schemas.portfolio import ProfileType


class TestProfileDetector:
    """Test suite for profile type detection."""
    
    def test_detect_linkedin_profile(self):
        """Test detection of LinkedIn profiles."""
        assert detect_profile_type("https://linkedin.com/in/johndoe") == ProfileType.LINKEDIN
        assert detect_profile_type("https://www.linkedin.com/in/johndoe") == ProfileType.LINKEDIN
        assert detect_profile_type("http://linkedin.com/company/example") == ProfileType.LINKEDIN
    
    def test_detect_github_profile(self):
        """Test detection of GitHub profiles."""
        assert detect_profile_type("https://github.com/johndoe") == ProfileType.GITHUB
        assert detect_profile_type("https://www.github.com/johndoe") == ProfileType.GITHUB
        assert detect_profile_type("http://github.com/johndoe/repo") == ProfileType.GITHUB
    
    def test_detect_twitter_profile(self):
        """Test detection of Twitter/X profiles."""
        assert detect_profile_type("https://twitter.com/johndoe") == ProfileType.TWITTER
        assert detect_profile_type("https://x.com/johndoe") == ProfileType.TWITTER
        assert detect_profile_type("http://www.twitter.com/johndoe") == ProfileType.TWITTER
    
    def test_detect_youtube_profile(self):
        """Test detection of YouTube profiles."""
        assert detect_profile_type("https://youtube.com/channel/abc123") == ProfileType.YOUTUBE
        assert detect_profile_type("https://www.youtube.com/@johndoe") == ProfileType.YOUTUBE
        assert detect_profile_type("https://youtu.be/abc123") == ProfileType.YOUTUBE
    
    def test_detect_scholar_profile(self):
        """Test detection of Google Scholar profiles."""
        assert detect_profile_type("https://scholar.google.com/citations?user=abc123") == ProfileType.SCHOLAR
        assert detect_profile_type("https://research.google.com/johndoe") == ProfileType.SCHOLAR
    
    def test_detect_website_profile(self):
        """Test detection of personal websites."""
        assert detect_profile_type("https://johndoe.dev") == ProfileType.WEBSITE
        assert detect_profile_type("https://jane.io") == ProfileType.WEBSITE
        assert detect_profile_type("https://example.me") == ProfileType.WEBSITE
    
    def test_detect_other_for_unknown_urls(self):
        """Test that unknown URLs default to OTHER or WEBSITE."""
        # Simple domain structures may be detected as WEBSITE
        result1 = detect_profile_type("https://example.com/profile")
        assert result1 in [ProfileType.OTHER, ProfileType.WEBSITE]
        
        result2 = detect_profile_type("https://unknown-platform.com/user/profile")
        assert result2 in [ProfileType.OTHER, ProfileType.WEBSITE]
        
        # Non-HTTP protocols should be OTHER
        assert detect_profile_type("ftp://files.example.com") == ProfileType.OTHER
    
    def test_detect_other_for_invalid_input(self):
        """Test that invalid input defaults to OTHER."""
        assert detect_profile_type(None) == ProfileType.OTHER
        assert detect_profile_type("") == ProfileType.OTHER
        assert detect_profile_type("   ") == ProfileType.OTHER
        assert detect_profile_type(123) == ProfileType.OTHER
    
    def test_validate_valid_profile_type(self):
        """Test validation of valid profile types."""
        assert validate_and_fix_profile_type("linkedin") == ProfileType.LINKEDIN
        assert validate_and_fix_profile_type("github") == ProfileType.GITHUB
        assert validate_and_fix_profile_type("twitter") == ProfileType.TWITTER
        assert validate_and_fix_profile_type("other") == ProfileType.OTHER
    
    def test_validate_invalid_profile_type_with_url(self):
        """Test that invalid profile type falls back to URL detection."""
        result = validate_and_fix_profile_type(
            "invalid_type",
            "https://github.com/user"
        )
        assert result == ProfileType.GITHUB
        
        result = validate_and_fix_profile_type(
            "wrong",
            "https://linkedin.com/in/user"
        )
        assert result == ProfileType.LINKEDIN
    
    def test_validate_invalid_profile_type_without_url(self):
        """Test that invalid profile type without URL defaults to OTHER."""
        assert validate_and_fix_profile_type("invalid_type") == ProfileType.OTHER
        assert validate_and_fix_profile_type(None) == ProfileType.OTHER
        assert validate_and_fix_profile_type("") == ProfileType.OTHER
    
    def test_validate_handles_case_insensitive(self):
        """Test that profile type validation is case insensitive."""
        assert validate_and_fix_profile_type("LINKEDIN") == ProfileType.LINKEDIN
        assert validate_and_fix_profile_type("GitHub") == ProfileType.GITHUB
        assert validate_and_fix_profile_type("Twitter") == ProfileType.TWITTER
    
    def test_validate_handles_whitespace(self):
        """Test that profile type validation handles whitespace."""
        assert validate_and_fix_profile_type(" linkedin ") == ProfileType.LINKEDIN
        assert validate_and_fix_profile_type("  github  ") == ProfileType.GITHUB

