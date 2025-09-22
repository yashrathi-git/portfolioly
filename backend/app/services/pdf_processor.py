"""
PDF processing service for upload onboarding flow.

This module provides PDF text extraction, validation, and metadata extraction
functionality using PyMuPDF (fitz) for reliable PDF processing.
"""

import fitz  # PyMuPDF
import io
from typing import Dict, Any, Optional, Tuple
from fastapi import UploadFile, HTTPException

import magic
import hashlib
import asyncio
from datetime import datetime

from ..core.config import settings


# Import schemas from centralized location
from ..schemas.pdf import PDFMetadata, PDFParseResult


class PDFProcessor:
    """PDF processing service with validation and text extraction."""

    def __init__(self):
        self.max_file_size = settings.upload.max_file_size_bytes
        self.allowed_types = settings.upload.ALLOWED_FILE_TYPES

    async def parse_pdf(self, file: UploadFile, source: str) -> PDFParseResult:
        """
        Parse PDF file and extract text with metadata.

        Args:
            file: Uploaded PDF file
            source: Source type ("linkedin" or "resume")

        Returns:
            PDFParseResult with extracted text and metadata

        Raises:
            HTTPException: If validation fails or processing errors occur
        """
        try:
            # Read file content
            file_content = await file.read()
            await file.seek(0)  # Reset file pointer

            # Validate file
            self._validate_pdf_content(file_content, file.filename)

            # Extract text using PyMuPDF
            text = await self._extract_text_with_pymupdf(file_content)

            # Get metadata
            metadata = await self._get_metadata(file_content, file.filename, source)

            return PDFParseResult(text=text, metadata=metadata, success=True)

        except HTTPException:
            raise
        except Exception as e:
            return PDFParseResult(
                text="",
                metadata=PDFMetadata(
                    source=source,
                    pages=0,
                    filename=file.filename or "unknown",
                    size=0,
                    checksum="",
                    processed_at=datetime.utcnow(),
                ),
                success=False,
                error_message=f"PDF processing failed: {str(e)}",
            )

    def _validate_pdf_content(self, content: bytes, filename: Optional[str]) -> None:
        """
        Validate PDF file content and properties.

        Args:
            content: File content bytes
            filename: Original filename

        Raises:
            HTTPException: If validation fails
        """
        # Check file size
        if len(content) > self.max_file_size:
            raise HTTPException(
                status_code=413,
                detail={
                    "message": f"File too large (max {settings.upload.MAX_FILE_SIZE_MB}MB)",
                    "error_code": "FILE_TOO_LARGE",
                    "max_size_mb": settings.upload.MAX_FILE_SIZE_MB,
                },
            )

        # Check if content is empty
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail={"message": "Empty file uploaded", "error_code": "EMPTY_FILE"},
            )

        # Validate file type using magic numbers
        try:
            file_type = magic.from_buffer(content, mime=True)
            if file_type not in self.allowed_types:
                raise HTTPException(
                    status_code=415,
                    detail={
                        "message": "Please upload a PDF file",
                        "error_code": "INVALID_FILE_TYPE",
                        "detected_type": file_type,
                        "allowed_types": self.allowed_types,
                    },
                )
        except Exception:
            # Fallback to basic PDF header check
            if not content.startswith(b"%PDF-"):
                raise HTTPException(
                    status_code=415,
                    detail={
                        "message": "Please upload a valid PDF file",
                        "error_code": "INVALID_PDF_FORMAT",
                    },
                )

        # Try to open with PyMuPDF to validate PDF structure
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            if doc.page_count == 0:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "PDF file contains no pages",
                        "error_code": "EMPTY_PDF",
                    },
                )
            doc.close()
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Corrupted or invalid PDF file",
                    "error_code": "CORRUPTED_PDF",
                    "details": str(e),
                },
            )

    async def _extract_text_with_pymupdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF using PyMuPDF.

        Args:
            pdf_bytes: PDF file content as bytes

        Returns:
            Extracted text content
        """

        def extract_text():
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text_parts = []

            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    text_parts.append(text)

            doc.close()
            return "\n\n".join(text_parts)

        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, extract_text)

        # Clean up extracted text
        text = self._clean_extracted_text(text)

        if not text.strip():
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "No text could be extracted from PDF",
                    "error_code": "NO_TEXT_EXTRACTED",
                },
            )

        return text

    def _clean_extracted_text(self, text: str) -> str:
        """
        Clean and normalize extracted text.

        Args:
            text: Raw extracted text

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Remove excessive whitespace
        lines = []
        for line in text.split("\n"):
            cleaned_line = " ".join(line.split())
            if cleaned_line:
                lines.append(cleaned_line)

        # Join lines with single newlines
        cleaned_text = "\n".join(lines)

        # Remove excessive newlines (more than 2 consecutive)
        import re

        cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

        return cleaned_text.strip()

    async def _get_metadata(
        self, pdf_bytes: bytes, filename: Optional[str], source: str
    ) -> PDFMetadata:
        """
        Extract metadata from PDF.

        Args:
            pdf_bytes: PDF file content as bytes
            filename: Original filename
            source: Source type ("linkedin" or "resume")

        Returns:
            PDFMetadata object
        """

        def get_pdf_info():
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = doc.page_count
            doc.close()
            return page_count

        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        page_count = await loop.run_in_executor(None, get_pdf_info)

        # Calculate checksum
        checksum = hashlib.sha256(pdf_bytes).hexdigest()

        return PDFMetadata(
            source=source,
            pages=page_count,
            filename=filename or "unknown.pdf",
            size=len(pdf_bytes),
            checksum=checksum,
            processed_at=datetime.utcnow(),
        )

    def validate_source(self, source: str) -> bool:
        """
        Validate source parameter.

        Args:
            source: Source type to validate

        Returns:
            True if valid, False otherwise
        """
        return source in ["linkedin", "resume"]

    async def get_pdf_preview(self, pdf_bytes: bytes, max_chars: int = 500) -> str:
        """
        Get a preview of PDF text content.

        Args:
            pdf_bytes: PDF file content as bytes
            max_chars: Maximum characters to return

        Returns:
            Preview text
        """
        try:
            full_text = await self._extract_text_with_pymupdf(pdf_bytes)
            if len(full_text) <= max_chars:
                return full_text

            # Truncate at word boundary
            preview = full_text[:max_chars]
            last_space = preview.rfind(" ")
            if last_space > max_chars * 0.8:  # If we can find a space in the last 20%
                preview = preview[:last_space]

            return preview + "..."

        except Exception:
            return "Preview not available"


# Global PDF processor instance
_pdf_processor: Optional[PDFProcessor] = None


def get_pdf_processor() -> PDFProcessor:
    """Get the global PDF processor instance."""
    global _pdf_processor
    if _pdf_processor is None:
        _pdf_processor = PDFProcessor()
    return _pdf_processor
