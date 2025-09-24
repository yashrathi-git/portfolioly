"""
Unit tests for extraction prompts constants.

Tests that the extraction prompts are properly defined and accessible.
"""

import pytest
from app.constants.extraction_prompts import (
    PORTFOLIO_EXTRACTION_PROMPT,
    MAX_TOKENS_PER_REQUEST,
    MODEL_ENCODING,
)


class TestExtractionPrompts:
    """Test extraction prompts constants."""

    def test_portfolio_extraction_prompt_exists(self):
        """Test that the main extraction prompt is defined."""
        assert PORTFOLIO_EXTRACTION_PROMPT is not None
        assert isinstance(PORTFOLIO_EXTRACTION_PROMPT, str)
        assert len(PORTFOLIO_EXTRACTION_PROMPT) > 100

    def test_portfolio_extraction_prompt_content(self):
        """Test that the prompt contains key instructions."""
        prompt = PORTFOLIO_EXTRACTION_PROMPT

        # Check for key sections
        assert "Data Source Priority Rules" in prompt
        assert "Resume information takes priority over LinkedIn" in prompt
        assert (
            "GitHub repository data takes priority over PDF-extracted projects"
            in prompt
        )
        assert "All fields are optional" in prompt
        assert "return empty structured output" in prompt

        # Check for field guidelines
        assert "Personal Info:" in prompt
        assert "Work Experience:" in prompt
        assert "Projects:" in prompt
        assert "Education:" in prompt
        assert "Certifications:" in prompt

        # Check for conflict resolution
        assert "Conflict Resolution Guidelines" in prompt
        assert "Clarifying Questions" in prompt

    def test_token_constants(self):
        """Test that token counting constants are defined."""
        assert MAX_TOKENS_PER_REQUEST is not None
        assert isinstance(MAX_TOKENS_PER_REQUEST, int)
        assert MAX_TOKENS_PER_REQUEST > 0

        assert MODEL_ENCODING is not None
        assert isinstance(MODEL_ENCODING, str)
        assert len(MODEL_ENCODING) > 0

    def test_prompt_json_structure_example(self):
        """Test that the prompt includes JSON structure example."""
        prompt = PORTFOLIO_EXTRACTION_PROMPT

        assert "personal_info" in prompt
        assert "work_experiences" in prompt
        assert "projects" in prompt
        assert "education" in prompt
        assert "certifications" in prompt
        assert "text_blobs" in prompt
        assert "metadata" in prompt

    def test_prompt_examples(self):
        """Test that the prompt includes extraction examples."""
        prompt = PORTFOLIO_EXTRACTION_PROMPT

        assert "January 2020" in prompt
        assert "Software Engineer at Google" in prompt
        assert "Python, React, PostgreSQL" in prompt

    def test_prompt_instructions_completeness(self):
        """Test that all required instruction sections are present."""
        prompt = PORTFOLIO_EXTRACTION_PROMPT

        required_sections = [
            "IMPORTANT INSTRUCTIONS",
            "Data Source Priority Rules",
            "Data Quality Guidelines",
            "Field Extraction Guidelines",
            "Response Format",
            "Examples of Good Extraction",
            "Conflict Resolution Guidelines",
            "Clarifying Questions to Consider",
            "What NOT to do",
        ]

        for section in required_sections:
            assert section in prompt, f"Missing required section: {section}"
