"""Tests for PDF to markdown conversion functionality."""

import io
import pytest
from pathlib import Path
from extraction.markdown_converter import convert_pdf_to_markdown


class TestMarkdownConverter:
    """Test PDF to markdown conversion functionality."""

    def test_import_error_handling(self, monkeypatch):
        """Test that ImportError is raised when pymupdf4llm is not available."""
        # Mock the import to fail
        import sys

        original_modules = sys.modules.copy()

        # Remove pymupdf4llm if it exists
        if "pymupdf4llm" in sys.modules:
            monkeypatch.delitem(sys.modules, "pymupdf4llm")

        # Mock import to fail
        def mock_import(name, *args, **kwargs):
            if name == "pymupdf4llm":
                raise ImportError("No module named 'pymupdf4llm'")
            return original_modules.get(name)

        monkeypatch.setattr("builtins.__import__", mock_import)

        with pytest.raises(ImportError) as exc_info:
            convert_pdf_to_markdown(b"fake pdf bytes")

        assert "pymupdf4llm is required" in str(exc_info.value)

    def test_empty_input_validation(self):
        """Test that empty input raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(None)

        assert "cannot be empty or None" in str(exc_info.value)

    def test_invalid_type_validation(self):
        """Test that invalid input type raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(12345)  # Invalid type

        assert "Invalid PDF source type" in str(exc_info.value)

    def test_nonexistent_file_validation(self):
        """Test that nonexistent file path raises ValueError."""
        fake_path = Path("/nonexistent/path/to/file.pdf")

        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(fake_path)

        assert "PDF file not found" in str(exc_info.value)

    def test_string_path_validation(self):
        """Test that nonexistent string path raises ValueError."""
        fake_path = "/nonexistent/path/to/file.pdf"

        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(fake_path)

        assert "PDF file not found" in str(exc_info.value)

    def test_bytes_input_type_accepted(self, monkeypatch):
        """Test that bytes input is accepted and processed."""

        # Mock pymupdf4llm.to_markdown to return test markdown
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                return "# Test Markdown\n\nThis is test content."

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        # Test with bytes
        result = convert_pdf_to_markdown(b"fake pdf bytes")
        assert result == "# Test Markdown\n\nThis is test content."

    def test_path_input_type_accepted(self, monkeypatch, tmp_path):
        """Test that Path input is accepted and processed."""
        # Create a temporary file
        test_file = tmp_path / "test.pdf"
        test_file.write_bytes(b"fake pdf content")

        # Mock pymupdf4llm.to_markdown to return test markdown
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                return "# Test Markdown\n\nThis is test content."

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        # Test with Path
        result = convert_pdf_to_markdown(test_file)
        assert result == "# Test Markdown\n\nThis is test content."

    def test_string_path_input_accepted(self, monkeypatch, tmp_path):
        """Test that string path input is accepted and processed."""
        # Create a temporary file
        test_file = tmp_path / "test.pdf"
        test_file.write_bytes(b"fake pdf content")

        # Mock pymupdf4llm.to_markdown to return test markdown
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                return "# Test Markdown\n\nThis is test content."

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        # Test with string path
        result = convert_pdf_to_markdown(str(test_file))
        assert result == "# Test Markdown\n\nThis is test content."

    def test_empty_markdown_output_validation(self, monkeypatch):
        """Test that empty markdown output raises ValueError."""

        # Mock pymupdf4llm.to_markdown to return empty string
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                return ""

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(b"fake pdf bytes")

        assert "empty markdown content" in str(exc_info.value)

    def test_conversion_exception_handling(self, monkeypatch):
        """Test that conversion exceptions are wrapped in ValueError."""

        # Mock pymupdf4llm.to_markdown to raise an exception
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                raise RuntimeError("PDF is corrupted")

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        with pytest.raises(ValueError) as exc_info:
            convert_pdf_to_markdown(b"fake pdf bytes")

        assert "Failed to convert PDF to markdown" in str(exc_info.value)
        assert "PDF is corrupted" in str(exc_info.value)


class TestAPIIntegration:
    """Test integration with parse_profile_from_pdf API."""

    def test_parse_profile_from_pdf_import(self):
        """Test that parse_profile_from_pdf can be imported."""
        from extraction.api import parse_profile_from_pdf

        assert callable(parse_profile_from_pdf)

    def test_parse_profile_from_pdf_with_mock(self, monkeypatch, tmp_path):
        """Test parse_profile_from_pdf with mocked conversion."""
        # Create a temporary file
        test_file = tmp_path / "test.pdf"
        test_file.write_bytes(b"fake pdf content")

        # Mock pymupdf4llm to return valid LinkedIn markdown
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                return """### Contact

john.doe@example.com

linkedin.com/in/johndoe

### Top Skills

Python

JavaScript

React

# John Doe

Senior Software Engineer at TechCorp
San Francisco, California, United States

## Summary

Experienced software engineer with 10 years in the industry.

## Experience

### TechCorp

Senior Software Engineer

Jan 2020 - Present · 4 yrs 10 mos

San Francisco, California, United States

## Education

### University of California

Bachelor of Science - BS, Computer Science

2010 - 2014
"""

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        from extraction.api import parse_profile_from_pdf

        # Test the function
        result = parse_profile_from_pdf(test_file)

        # Verify basic structure
        assert result["name"] == "John Doe"
        assert "TechCorp" in result["headline"]
        assert result["location"] == "San Francisco, California, United States"
        assert result["contact"]["email"] == "john.doe@example.com"
        assert len(result["top_skills"]) == 3
        assert "Python" in result["top_skills"]

    def test_parse_profile_from_pdf_error_propagation(self, monkeypatch):
        """Test that errors are properly propagated from parse_profile_from_pdf."""

        # Mock pymupdf4llm to raise an exception
        class MockPyMuPDF4LLM:
            @staticmethod
            def to_markdown(source):
                raise RuntimeError("Conversion failed")

        import sys

        monkeypatch.setitem(sys.modules, "pymupdf4llm", MockPyMuPDF4LLM())

        from extraction.api import parse_profile_from_pdf

        with pytest.raises(ValueError) as exc_info:
            parse_profile_from_pdf(b"fake pdf bytes")

        assert "PDF conversion failed" in str(exc_info.value)
