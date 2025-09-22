"""
Pydantic schemas for API request/response models.

This module centralizes all Pydantic models used for API serialization,
validation, and documentation.
"""

# Re-export commonly used schemas for convenience
from .auth import UserToken, AuthResponse, ErrorResponse
from .github import GitHubRepo, PaginatedRepoResponse
from .pdf import PDFMetadata, PDFParseResult
from .upload import (
    GitHubRepoData,
    PDFData,
    UploadSubmissionRequest,
    UploadSubmissionResponse,
)

__all__ = [
    # Auth schemas
    "UserToken",
    "AuthResponse",
    "ErrorResponse",
    # GitHub schemas
    "GitHubRepo",
    "PaginatedRepoResponse",
    # PDF schemas
    "PDFMetadata",
    "PDFParseResult",
    # Upload schemas
    "GitHubRepoData",
    "PDFData",
    "UploadSubmissionRequest",
    "UploadSubmissionResponse",
]
