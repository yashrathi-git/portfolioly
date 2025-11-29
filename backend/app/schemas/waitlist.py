"""Waitlist signup schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class WaitlistSignupRequest(BaseModel):
    """Request schema for waitlist signup."""

    email: EmailStr
    source: str = "resume_builder"  # Which waitlist (resume_builder, etc.)


class WaitlistSignupResponse(BaseModel):
    """Response schema for waitlist signup."""

    success: bool
    message: str
    already_signed_up: bool = False


class WaitlistEntry(BaseModel):
    """Waitlist entry stored in Firestore."""

    email: str
    source: str
    created_at: datetime
    ip_address: Optional[str] = None
