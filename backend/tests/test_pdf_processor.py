"""
Unit tests for PDF processing functionality.
"""

import pytest
import io
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from fastapi import UploadFile, HTTPException

from app.services.pdf_processor import PDFProcessor
from app.schemas.pdf import PDFParseResult, PDFMetadata


class TestPDFProcessor:
    """Test cases for PDFProcessor."""

    @pytest.fixture
    def pdf_processor(self):
        return PDFProcessor()

    @pytest.fixture
    def mock_pdf_content(self):
        """Mock PDF content with proper PDF header."""
        return b"%PDF-1.4\nSample PDF content for testing"

    @pytest.fixture
    def mock_upload_file(self, mock_pdf_content):
        """Mock UploadFile with PDF content."""
        file_like = io.BytesIO(mock_pdf_content)
        upload_file = UploadFile(filename="test.pdf", file=file_like)
        return upload_file

    def test_validate_source_valid(self, pdf_processor):
        """Test that valid sources are accepted."""
        assert pdf_processor.validate_source("linkedin") is True
        assert pdf_processor.validate_source("resume") is True

    def test_validate_source_invalid(self, pdf_processor):
        """Test that invalid sources are rejected."""
        assert pdf_processor.validate_source("invalid") is False
        assert pdf_processor.validate_source("") is False
        assert pdf_processor.validate_source("LINKEDIN") is False

    def test_validate_pdf_content_empty_file(self, pdf_processor):
        """Test that empty files are rejected."""
        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(b"", "test.pdf")

        assert exc_info.value.status_code == 400
        assert "EMPTY_FILE" in str(exc_info.value.detail)

    def test_validate_pdf_content_too_large(self, pdf_processor):
        """Test that files exceeding size limit are rejected."""
        # Create content larger than max size
        large_content = b"x" * (pdf_processor.max_file_size + 1)

        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(large_content, "test.pdf")

        assert exc_info.value.status_code == 413
        assert "FILE_TOO_LARGE" in str(exc_info.value.detail)

    def test_validate_pdf_content_invalid_format(self, pdf_processor):
        """Test that non-PDF files are rejected."""
        invalid_content = b"This is not a PDF file"

        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(invalid_content, "test.txt")

        assert exc_info.value.status_code == 415
        assert "INVALID_PDF_FORMAT" in str(exc_info.value.detail)

    @patch("app.services.pdf_processor.fitz.open")
    @patch("app.services.pdf_processor.magic.from_buffer")
    def test_validate_pdf_content_magic_detection(
        self, mock_magic, mock_fitz_open, pdf_processor, mock_pdf_content
    ):
        """Test file type validation using magic numbers."""
        # Mock PyMuPDF for successful validation
        mock_doc = Mock()
        mock_doc.page_count = 1
        mock_doc.close = Mock()
        mock_fitz_open.return_value = mock_doc

        mock_magic.return_value = "application/pdf"

        # Should not raise exception for valid PDF
        pdf_processor._validate_pdf_content(mock_pdf_content, "test.pdf")

        # Should raise exception for invalid type
        mock_magic.return_value = "text/plain"
        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(mock_pdf_content, "test.txt")

        assert exc_info.value.status_code == 415
        assert "INVALID_FILE_TYPE" in str(exc_info.value.detail)

    @patch("app.services.pdf_processor.fitz.open")
    def test_validate_pdf_content_corrupted_pdf(
        self, mock_fitz_open, pdf_processor, mock_pdf_content
    ):
        """Test that corrupted PDFs are rejected."""
        mock_doc = Mock()
        mock_doc.page_count = 0
        mock_fitz_open.return_value = mock_doc

        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(mock_pdf_content, "test.pdf")

        assert exc_info.value.status_code == 422
        assert "EMPTY_PDF" in str(exc_info.value.detail)

    @patch("app.services.pdf_processor.fitz.open")
    def test_validate_pdf_content_fitz_exception(
        self, mock_fitz_open, pdf_processor, mock_pdf_content
    ):
        """Test handling of PyMuPDF exceptions during validation."""
        mock_fitz_open.side_effect = Exception("PDF parsing error")

        with pytest.raises(HTTPException) as exc_info:
            pdf_processor._validate_pdf_content(mock_pdf_content, "test.pdf")

        assert exc_info.value.status_code == 422
        assert "CORRUPTED_PDF" in str(exc_info.value.detail)

    def test_clean_extracted_text_empty(self, pdf_processor):
        """Test cleaning empty text."""
        result = pdf_processor._clean_extracted_text("")
        assert result == ""

        result = pdf_processor._clean_extracted_text(None)
        assert result == ""

    def test_clean_extracted_text_whitespace(self, pdf_processor):
        """Test cleaning text with excessive whitespace."""
        messy_text = "  Line 1  \n\n\n  Line 2   \n\n\n\n\nLine 3  "
        expected = "Line 1\nLine 2\nLine 3"

        result = pdf_processor._clean_extracted_text(messy_text)
        assert result == expected

    def test_clean_extracted_text_multiple_spaces(self, pdf_processor):
        """Test cleaning text with multiple spaces."""
        messy_text = "Word1    Word2     Word3\nLine2   with    spaces"
        expected = "Word1 Word2 Word3\nLine2 with spaces"

        result = pdf_processor._clean_extracted_text(messy_text)
        assert result == expected

    @pytest.mark.asyncio
    async def test_extract_text_with_pymupdf_success(self, pdf_processor):
        """Test successful text extraction with real PDF."""
        # Load real PDF file
        pdf_path = Path(__file__).parent / "assets" / "test_pdf.pdf"
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        result = await pdf_processor._extract_text_with_pymupdf(pdf_bytes, "resume")

        # Should return markdown text
        assert result is not None
        assert len(result) > 0
        assert isinstance(result, str)

    @pytest.mark.asyncio
    @patch("app.services.pdf_processor.convert_pdf_to_markdown")
    async def test_extract_text_with_pymupdf_no_text(self, mock_convert, pdf_processor):
        """Test handling of PDFs with no extractable text."""
        # Mock markdown converter to return empty string
        mock_convert.return_value = "   \n\n   "  # Only whitespace

        pdf_bytes = b"%PDF-1.4 sample content"

        with pytest.raises(HTTPException) as exc_info:
            await pdf_processor._extract_text_with_pymupdf(pdf_bytes, "resume")

        assert exc_info.value.status_code == 422
        assert "NO_TEXT_EXTRACTED" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.services.pdf_processor.convert_pdf_to_markdown")
    async def test_extract_text_multiple_pages(self, mock_convert, pdf_processor):
        """Test text extraction from multiple pages."""
        # Mock markdown converter to return multi-page content
        mock_convert.return_value = (
            "# Page 1\n\nPage 1 content\n\n# Page 2\n\nPage 2 content"
        )

        pdf_bytes = b"%PDF-1.4 sample content"
        result = await pdf_processor._extract_text_with_pymupdf(pdf_bytes, "resume")

        assert "Page 1 content" in result
        assert "Page 2 content" in result

    @pytest.mark.asyncio
    @patch("app.services.pdf_processor.fitz.open")
    async def test_get_metadata(self, mock_fitz_open, pdf_processor):
        """Test metadata extraction."""
        mock_doc = Mock()
        mock_doc.page_count = 3
        mock_doc.close = Mock()

        mock_fitz_open.return_value = mock_doc

        pdf_bytes = b"%PDF-1.4 sample content"
        metadata = await pdf_processor._get_metadata(pdf_bytes, "test.pdf", "linkedin")

        assert metadata.source == "linkedin"
        assert metadata.pages == 3
        assert metadata.filename == "test.pdf"
        assert metadata.size == len(pdf_bytes)
        assert len(metadata.checksum) == 64  # SHA256 hex length
        assert metadata.processed_at is not None

    @pytest.mark.asyncio
    async def test_get_pdf_preview_short_text(self, pdf_processor):
        """Test PDF preview with short text."""
        with patch.object(pdf_processor, "_extract_text_with_pymupdf") as mock_extract:
            mock_extract.return_value = "Short text"

            pdf_bytes = b"%PDF-1.4 sample"
            preview = await pdf_processor.get_pdf_preview(pdf_bytes, max_chars=500)

            assert preview == "Short text"

    @pytest.mark.asyncio
    async def test_get_pdf_preview_long_text(self, pdf_processor):
        """Test PDF preview with long text that needs truncation."""
        long_text = "This is a very long text " * 50  # Much longer than max_chars

        with patch.object(pdf_processor, "_extract_text_with_pymupdf") as mock_extract:
            mock_extract.return_value = long_text

            pdf_bytes = b"%PDF-1.4 sample"
            preview = await pdf_processor.get_pdf_preview(pdf_bytes, max_chars=100)

            assert (
                len(preview) <= 104
            )  # 100 + "..." = 103, plus some buffer for word boundary
            assert preview.endswith("...")

    @pytest.mark.asyncio
    async def test_get_pdf_preview_extraction_error(self, pdf_processor):
        """Test PDF preview when text extraction fails."""
        with patch.object(pdf_processor, "_extract_text_with_pymupdf") as mock_extract:
            mock_extract.side_effect = Exception("Extraction failed")

            pdf_bytes = b"%PDF-1.4 sample"
            preview = await pdf_processor.get_pdf_preview(pdf_bytes)

            assert preview == "Preview not available"

    @pytest.mark.asyncio
    async def test_parse_pdf_success(self, pdf_processor):
        """Test successful PDF parsing with real PDF."""
        # Load real PDF file
        pdf_path = Path(__file__).parent / "assets" / "test_pdf.pdf"
        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        # Create upload file
        file_like = io.BytesIO(pdf_content)
        upload_file = UploadFile(filename="test.pdf", file=file_like)

        result = await pdf_processor.parse_pdf(upload_file, "linkedin")

        assert result.success is True
        assert len(result.text) > 0
        assert result.metadata.source == "linkedin"
        assert result.metadata.pages > 0
        assert result.error_message is None

    @pytest.mark.asyncio
    async def test_parse_pdf_validation_failure(self, pdf_processor):
        """Test PDF parsing with validation failure."""
        # Create upload file with invalid content
        invalid_content = b"Not a PDF"
        file_like = io.BytesIO(invalid_content)
        upload_file = UploadFile(filename="test.txt", file=file_like)

        with pytest.raises(HTTPException):
            await pdf_processor.parse_pdf(upload_file, "linkedin")

    @pytest.mark.asyncio
    @patch("app.services.pdf_processor.convert_pdf_to_markdown")
    async def test_parse_pdf_extraction_failure(self, mock_convert, pdf_processor):
        """Test PDF parsing with text extraction failure."""
        # Load real PDF file for validation to pass
        pdf_path = Path(__file__).parent / "assets" / "test_pdf.pdf"
        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        # Create upload file
        file_like = io.BytesIO(pdf_content)
        upload_file = UploadFile(filename="test.pdf", file=file_like)

        # Mock markdown converter to raise exception
        mock_convert.side_effect = Exception("Text extraction failed")

        result = await pdf_processor.parse_pdf(upload_file, "linkedin")

        assert result.success is False
        assert result.text == ""
        assert "PDF processing failed" in result.error_message
        assert result.metadata.source == "linkedin"


def test_get_pdf_processor_singleton():
    """Test that get_pdf_processor returns the same instance."""
    from app.services.pdf_processor import get_pdf_processor

    processor1 = get_pdf_processor()
    processor2 = get_pdf_processor()

    assert processor1 is processor2
    assert isinstance(processor1, PDFProcessor)
