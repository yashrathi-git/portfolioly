"""
Simplified extraction schema for AI-powered portfolio data extraction.

This schema contains ONLY fields that can be reliably extracted from PDF text
and GitHub data. Fields like images, logos, and layout settings are excluded
and will be added during post-processing.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class DateInfo(BaseModel):
    """Structured date information with numeric month and year."""

    month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    year: Optional[int] = Field(None, ge=1900, le=2100, description="4-digit year")


class ExtractedProfile(BaseModel):
    """
    Simplified profile extraction - just URL and optional label.
    Profile type will be auto-detected during post-processing.
    """

    url: Optional[str] = None
    label: Optional[str] = None


class ExtractedPersonalInfo(BaseModel):
    """Personal information extractable from PDFs."""

    full_name: Optional[str] = None
    headline: Optional[str] = None
    chatfolio_headline: Optional[str] = None
    summary: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profiles: Optional[List[ExtractedProfile]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)


class ExtractedWorkExperience(BaseModel):
    """Work experience extractable from PDFs."""

    organization: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    highlights: Optional[str] = None
    technologies: Optional[List[str]] = Field(default_factory=list)
    more_context: Optional[str] = None


class ExtractedProject(BaseModel):
    """Project information extractable from PDFs and GitHub."""

    name: Optional[str] = None
    highlights: Optional[str] = None
    technologies: Optional[List[str]] = Field(default_factory=list)
    github: Optional[str] = None
    live_link: Optional[str] = None
    demo_video: Optional[str] = None
    more_context: Optional[str] = None


class ExtractedEducation(BaseModel):
    """Education information extractable from PDFs."""

    institution: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    location: Optional[str] = None
    grade: Optional[str] = None


class ExtractedCertification(BaseModel):
    """Certification information extractable from PDFs."""

    name: Optional[str] = None
    issuer: Optional[str] = None
    link: Optional[str] = None


class ExtractedTextBlobs(BaseModel):
    """Unstructured text information from PDFs."""

    achievements: Optional[str] = None
    additional_context: Optional[str] = None


class PortfolioExtractionData(BaseModel):
    """
    Simplified portfolio extraction schema for AI.

    Contains ONLY fields that can be extracted from PDF text and GitHub data.
    Post-processing will add layout_settings, metadata, and other system fields.
    Images and logos are handled separately via upload endpoints.
    """

    personal_info: Optional[ExtractedPersonalInfo] = Field(
        default_factory=ExtractedPersonalInfo
    )
    work_experiences: Optional[List[ExtractedWorkExperience]] = Field(
        default_factory=list
    )
    projects: Optional[List[ExtractedProject]] = Field(default_factory=list)
    education: Optional[List[ExtractedEducation]] = Field(default_factory=list)
    certifications: Optional[List[ExtractedCertification]] = Field(default_factory=list)
    text_blobs: Optional[ExtractedTextBlobs] = Field(default_factory=ExtractedTextBlobs)
