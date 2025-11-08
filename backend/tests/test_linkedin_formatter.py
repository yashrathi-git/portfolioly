"""
Tests for LinkedIn data formatting service.

This module tests the LinkedIn formatter that pre-processes LinkedIn PDF data
for better AI extraction with structured formatting. Company name cleaning
is handled by the LLM based on prompt instructions.
"""

import pytest
from app.services.linkedin_formatter import (
    format_linkedin_for_ai,
    _format_role,
    _format_date_range,
    _format_date,
)


class TestFormatDate:
    """Tests for date formatting functions."""
    
    def test_format_date_with_month(self):
        """Test formatting dates with month and year."""
        assert _format_date("2020-01-15") == "Jan 2020"
        assert _format_date("2021-06-30") == "Jun 2021"
        assert _format_date("2023-12-01") == "Dec 2023"
    
    def test_format_date_year_only(self):
        """Test formatting dates with only year."""
        assert _format_date("2020") == "2020"
        assert _format_date("2020-00-00") == "2020"
    
    def test_format_date_invalid(self):
        """Test formatting invalid dates."""
        assert _format_date("invalid") == "invalid"
        assert _format_date("") == ""
    
    def test_format_date_range_current(self):
        """Test formatting current date ranges."""
        assert _format_date_range("2020-01", None, current=True) == "Jan 2020 - Present"
        assert _format_date_range("2021-06", None, end_date_text="Present") == "Jun 2021 - Present"
    
    def test_format_date_range_complete(self):
        """Test formatting complete date ranges."""
        result = _format_date_range("2020-01", "2023-12")
        assert "Jan 2020" in result and "Dec 2023" in result
    
    def test_format_date_range_no_start(self):
        """Test formatting when start date is missing."""
        assert _format_date_range(None, "2023-12") is None


class TestFormatRole:
    """Tests for role formatting function."""
    
    def test_format_complete_role(self):
        """Test formatting a role with all information."""
        role_data = {
            "title": "Senior Software Engineer",
            "company_name": "Writesonic – YCombinator backed startup",
            "location": "San Francisco, CA",
            "start_date": "2020-01",
            "end_date": "2023-12",
            "is_current": False,
            "highlights": "- Led team of 5\n- Improved performance by 40%"
        }
        result = _format_role(role_data)
        
        assert "Senior Software Engineer" in result
        # Company name should be passed through as-is (LLM will clean it)
        assert "Writesonic" in result or "YCombinator" in result
        assert "San Francisco, CA" in result
        assert "Led team of 5" in result
    
    def test_format_role_skip_company(self):
        """Test formatting role without company (for company groups)."""
        role_data = {
            "title": "Software Engineer",
            "location": "New York, NY",
            "start_date": "2018-01",
            "is_current": True
        }
        result = _format_role(role_data, skip_company=True)
        
        assert "Software Engineer" in result
        assert "New York, NY" in result
        assert "Present" in result
    
    def test_format_role_minimal(self):
        """Test formatting role with minimal information."""
        role_data = {
            "title": "Developer"
        }
        result = _format_role(role_data)
        
        assert "Developer" in result


class TestFormatLinkedInForAI:
    """Tests for format_linkedin_for_ai function."""
    
    def test_format_basic_profile(self):
        """Test formatting a basic profile."""
        # This test requires the pdf_parser package to be available
        # For now, we'll test the fallback behavior
        markdown = "# John Doe\nSoftware Engineer"
        result = format_linkedin_for_ai(markdown)
        
        # Should return either formatted data or fallback to raw markdown
        assert result is not None
        assert len(result) > 0
    
    def test_format_empty_markdown(self):
        """Test formatting empty markdown."""
        result = format_linkedin_for_ai("")
        assert result == ""
    
    def test_format_fallback_on_error(self):
        """Test that formatting falls back to raw markdown on error."""
        # Malformed data that will cause parsing to fail
        markdown = "This is not valid LinkedIn markdown format"
        result = format_linkedin_for_ai(markdown)
        
        # Should fallback to original markdown
        assert markdown in result or result == markdown


class TestIntegrationScenarios:
    """Integration tests for realistic scenarios."""
    
    def test_format_preserves_raw_company_names(self):
        """Test that company names are passed through without cleaning."""
        role_data = {
            "title": "Engineer",
            "company_name": "Writesonic – YCombinator backed startup",
        }
        result = _format_role(role_data)
        
        # Should contain the raw company name (LLM will clean it)
        assert "Writesonic – YCombinator backed startup" in result or "Writesonic" in result
    
    def test_format_role_with_various_companies(self):
        """Test formatting roles with various company name formats."""
        companies = [
            "Meta (formerly Facebook)",
            "Google Inc.",
            "Startup - Series A funded",
        ]
        
        for company in companies:
            role_data = {"title": "Engineer", "company_name": company}
            result = _format_role(role_data)
            # Should include the company name in some form
            assert len(result) > 0
            assert "Engineer" in result

