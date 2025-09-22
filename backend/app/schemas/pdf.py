"""PDF processing-related Pydantic schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class PDFMetadata(BaseModel):
    """PDF metadata model."""

    source: str  # "linkedin" or "resume"
    pages: int
    filename: str
    size: int
    checksum: str
    processed_at: datetime
    blob_url: Optional[str] = None


class PDFParseResult(BaseModel):
    """Result of PDF parsing operation."""

    text: str
    metadata: PDFMetadata
    success: bool
    error_message: Optional[str] = None
