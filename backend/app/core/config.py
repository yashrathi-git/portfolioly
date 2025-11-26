"""Application configuration settings."""

import os
from typing import List, Optional
from pydantic import BaseModel, field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
import dotenv

dotenv.load_dotenv()

# Default CORS origins (always included)
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "https://portfolioly.app",
    "https://www.portfolioly.app",
]


class StorageContainerNames(BaseModel):
    """Azure Blob Storage container names used across the application."""

    resumes: str = "user-uploaded-pdfs"
    images: str = "images"


class UploadSettings(BaseModel):
    """Configuration for upload, GitHub, storage, and rate limiting."""

    # File upload limits
    MAX_FILE_SIZE_MB: int = 2
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf"]

    # Image upload configuration
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5024KB
    MAX_PROJECT_IMAGES: int = 5  # Maximum images per project
    MAX_IMAGE_CAPTION_LENGTH: int = 100  # Maximum characters for image captions
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ]
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    IMAGE_QUALITY: int = 85  # JPEG/WebP quality for optimization (not applied to GIFs)
    MAX_IMAGE_DIMENSION: int = (
        1920  # Max width/height for web optimization (not applied to GIFs)
    )

    # GitHub integration
    MAX_GITHUB_REPOS: int = 10
    GITHUB_REPOS_PER_PAGE: int = 20
    GITHUB_API_TIMEOUT: int = 30

    # Storage configuration
    ENABLE_AZURE_STORAGE: bool = True
    CONTAINERS: StorageContainerNames = StorageContainerNames()
    AZURE_STORAGE_BLOB_PREFIX: str = "user-files"

    # Rate limiting configuration
    RATE_LIMIT_PDF_UPLOADS_PER_HOUR: int = 10
    RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR: int = 10
    RATE_LIMIT_STORAGE_BACKEND: str = "memory"  # "memory" or "redis"

    # GitHub API token (optional for higher rate limits)
    GITHUB_API_TOKEN: str = os.getenv("GITHUB_API_TOKEN", "")

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def has_github_token(self) -> bool:
        return bool((self.GITHUB_API_TOKEN or "").strip())


class BrandfetchSettings(BaseModel):
    """Configuration for Brandfetch logo enrichment."""

    enabled: bool = False
    client_id: Optional[str] = None
    base_url: str = "https://api.brandfetch.io/v2"
    search_timeout_seconds: float = 3.0
    max_search_results: int = 1


class Settings(BaseSettings):
    """Application settings."""

    # App settings
    app_name: str = "Portfolioly API"
    debug: bool = False
    version: str = "1.0.0"

    # CORS settings (comma-separated string from env, parsed to list)
    allowed_origins_str: str = ""
    frontend_origin: Optional[str] = None

    @computed_field
    @property
    def allowed_origins(self) -> List[str]:
        """Parse allowed origins from string and merge with defaults."""
        origins = set(DEFAULT_CORS_ORIGINS)

        if self.allowed_origins_str:
            if self.allowed_origins_str.strip() == "*":
                return ["*"]
            for origin in self.allowed_origins_str.split(","):
                if origin.strip():
                    origins.add(origin.strip())

        if self.frontend_origin:
            origins.add(self.frontend_origin)

        return list(origins)

    # Firebase settings
    google_application_credentials: Optional[str] = None
    firebase_credentials: Optional[str] = None
    firebase_project_id: Optional[str] = None

    # Security settings
    require_email_verification: bool = True
    global_secret: str  # Required: Global secret for token generation (min 32 chars)

    # Azure AI settings
    azure_ai_endpoint: Optional[str] = None
    azure_ai_api_key: Optional[str] = None
    azure_ai_processor_model: Optional[str] = None

    # Google Gemini settings
    gemini_api_key: Optional[str] = None

    # Azure Blob Storage settings
    azure_storage_connection_string: Optional[str] = None
    azure_storage_account_url: Optional[str] = None
    azure_storage_account_key: Optional[str] = None

    # Nested groups
    upload: UploadSettings = UploadSettings()
    brandfetch: BrandfetchSettings = BrandfetchSettings()

    # SettingsConfig (pydantic v2)
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
        env_nested_delimiter="__",
    )

    @field_validator("global_secret")
    @classmethod
    def validate_global_secret(cls, v: str) -> str:
        """Validate that GLOBAL_SECRET is configured and meets minimum length."""
        if not v:
            raise ValueError(
                "GLOBAL_SECRET must be configured in environment variables. "
                "This is required for public token generation."
            )
        if len(v) < 32:
            raise ValueError(
                f"GLOBAL_SECRET must be at least 32 characters long. "
                f"Current length: {len(v)}"
            )
        return v


# Global settings instance
settings = Settings()
