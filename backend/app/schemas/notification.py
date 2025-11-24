"""
Notification preference schema models.
"""

from typing import Literal
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationPreference(BaseModel):
    """User notification signup for a specific feature."""

    user_id: str = Field(..., description="Firebase user ID")
    notification_type: Literal["resume_feature", "analytics_feature"] = Field(
        ..., description="Type of notification"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="When user signed up"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat() + "Z"}


class NotificationSignupRequest(BaseModel):
    """Schema for signing up for notifications."""

    notification_type: Literal["resume_feature", "analytics_feature"] = Field(
        ..., description="Type of notification"
    )


class NotificationPreferenceResponse(BaseModel):
    """Response schema for notification preference."""

    notification_type: str
    created_at: str
