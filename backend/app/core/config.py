"""Application configuration settings."""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App settings
    app_name: str = "Portfolioly API"
    debug: bool = False
    version: str = "1.0.0"

    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000"]
    frontend_origin: Optional[str] = None

    # Firebase settings
    google_application_credentials: Optional[str] = None
    firebase_project_id: Optional[str] = None

    # Security settings
    require_email_verification: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Add frontend origin to allowed origins if specified
        if self.frontend_origin and self.frontend_origin not in self.allowed_origins:
            self.allowed_origins.append(self.frontend_origin)


# Global settings instance
settings = Settings()
