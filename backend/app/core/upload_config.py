"""
Upload configuration constants for the onboarding flow.

This module contains all configuration constants related to file uploads,
GitHub integration, and rate limiting for the upload onboarding feature.
"""

from typing import List
from pydantic import BaseModel
import os


class UploadConfig(BaseModel):
    """Configuration constants for upload functionality."""

    # File upload limits
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf"]

    # GitHub integration
    MAX_GITHUB_REPOS: int = 10
    GITHUB_REPOS_PER_PAGE: int = 20
    GITHUB_API_TIMEOUT: int = 30

    # Storage configuration
    ENABLE_AZURE_STORAGE: bool = False

    # Rate limiting configuration
    RATE_LIMIT_PDF_UPLOADS_PER_HOUR: int = 10
    RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR: int = 30
    RATE_LIMIT_STORAGE_BACKEND: str = "memory"  # "memory" or "redis"

    # GitHub API token (optional for higher rate limits)
    GITHUB_API_TOKEN: str = os.getenv("GITHUB_API_TOKEN", "")

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MAX_FILE_SIZE_MB to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def has_github_token(self) -> bool:
        """Check if GitHub API token is configured."""
        return bool(self.GITHUB_API_TOKEN.strip())


# Global configuration instance
upload_config = UploadConfig()
