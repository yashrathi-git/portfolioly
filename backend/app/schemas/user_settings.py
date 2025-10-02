"""
User settings schema models for username and portfolio visibility management.
"""

from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator
import re


class PortfolioChatSettings(BaseModel):
    """Chat-specific settings for portfolio owners."""

    enabled: bool = Field(True, description="Whether chat is enabled at all")
    access_mode: Literal["public", "private"] = Field(
        "public", description="Public or private access"
    )
    monthly_message_count: int = Field(
        0, description="Total messages received this month"
    )
    monthly_message_limit: int = Field(100, description="Monthly limit for pricing")
    month_reset_date: datetime = Field(
        default_factory=datetime.utcnow, description="Date when monthly counter resets"
    )
    last_message_at: Optional[datetime] = Field(
        None, description="Timestamp of last message received"
    )


class UserSettings(BaseModel):
    """User settings for public portfolio management."""

    user_id: str = Field(..., description="Firebase user ID")
    username: Optional[str] = Field(
        None, description="Public username for portfolio access"
    )
    is_public: bool = Field(
        False, description="Whether the portfolio is publicly accessible"
    )
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow, description="When settings were created"
    )
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow, description="When settings were last updated"
    )
    chat_settings: Optional[PortfolioChatSettings] = Field(
        default_factory=PortfolioChatSettings, description="Chat-specific settings"
    )

    @validator("username")
    def validate_username(cls, v):
        if v is None:
            return v

        # Username validation rules
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 30:
            raise ValueError("Username must be no more than 30 characters long")

        # Allow alphanumeric characters, hyphens, and underscores
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Username can only contain letters, numbers, hyphens, and underscores"
            )

        # Don't allow usernames that start or end with hyphens/underscores
        if v.startswith(("-", "_")) or v.endswith(("-", "_")):
            raise ValueError("Username cannot start or end with hyphens or underscores")

        # Reserved usernames
        reserved = {
            "admin",
            "api",
            "www",
            "mail",
            "ftp",
            "localhost",
            "root",
            "support",
            "help",
            "about",
            "contact",
        }
        if v.lower() in reserved:
            raise ValueError("This username is reserved")

        return v.lower()  # Store usernames in lowercase

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat() + "Z"}
        schema_extra = {
            "example": {
                "user_id": "firebase_user_123",
                "username": "johndoe",
                "is_public": True,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
            }
        }


class UserSettingsCreate(BaseModel):
    """Schema for creating new user settings."""

    username: Optional[str] = None
    is_public: bool = False

    @validator("username")
    def validate_username(cls, v):
        return UserSettings.validate_username(v) if v else v


class UserSettingsUpdate(BaseModel):
    """Schema for updating existing user settings."""

    username: Optional[str] = None
    is_public: Optional[bool] = None

    @validator("username")
    def validate_username(cls, v):
        return UserSettings.validate_username(v) if v else v


class UsernameAvailabilityResponse(BaseModel):
    """Response schema for username availability check."""

    available: bool
    reason: Optional[str] = None
    suggestions: Optional[list[str]] = None


class UserSettingsResponse(BaseModel):
    """Response schema for user settings."""

    username: Optional[str] = None
    is_public: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
