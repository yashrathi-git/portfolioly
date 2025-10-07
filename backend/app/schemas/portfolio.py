"""
Portfolio data schema models for AI-extracted user information.

This module defines Pydantic models for the structured portfolio data
that will be extracted from PDFs and GitHub repositories using AI processing.
All fields are optional to handle incomplete or missing information from
unstructured PDF data.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ProfileType(str, Enum):
    """Supported profile types for user social/professional profiles."""

    LINKEDIN = "linkedin"
    GITHUB = "github"
    WEBSITE = "website"
    PORTFOLIO = "portfolio"
    YOUTUBE = "youtube"
    TWITTER = "twitter"
    SCHOLAR = "scholar"
    OTHER = "other"


class DateInfo(BaseModel):
    """Structured date information with numeric month and year."""

    month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    year: Optional[int] = Field(None, ge=1900, le=2100, description="4-digit year")


class Profile(BaseModel):
    """User profile/social media link information."""

    type: Optional[ProfileType] = None
    url: Optional[str] = None
    label: Optional[str] = None


class PersonalInfo(BaseModel):
    """Personal information section of the portfolio."""

    full_name: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_photo_url: Optional[str] = None
    profiles: Optional[List[Profile]] = Field(default_factory=list)


class WorkExperience(BaseModel):
    """Work experience entry with structured dates."""

    organization: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    highlights: Optional[str] = None
    technologies: Optional[List[str]] = Field(default_factory=list)
    more_context: Optional[str] = None


class ProjectImage(BaseModel):
    """Project image with optional caption."""

    url: str = Field(..., description="Image URL from Azure Blob Storage")
    caption: Optional[str] = Field(
        None, max_length=100, description="Optional caption (max 100 chars)"
    )
    order: int = Field(..., description="Display order (0-indexed)")


class Project(BaseModel):
    """Project information with links and technologies."""

    name: Optional[str] = None
    highlights: Optional[str] = None
    technologies: Optional[List[str]] = Field(default_factory=list)
    github: Optional[str] = None
    live_link: Optional[str] = None
    demo_video: Optional[str] = Field(
        None, description="YouTube link for project demo video"
    )
    more_context: Optional[str] = Field(
        None, description="Markdown-supported detailed description"
    )
    images: Optional[List[ProjectImage]] = Field(
        default_factory=list,
        description="Ordered list of images with captions (max 5)",
    )


class Education(BaseModel):
    """Education information with structured dates."""

    institution: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    location: Optional[str] = None
    grade: Optional[str] = None


class Certification(BaseModel):
    """Certification information."""

    name: Optional[str] = None
    issuer: Optional[str] = Field(
        None, description="Issuing organization (e.g., Coursera, Udemy)"
    )
    link: Optional[str] = None


class TextBlobs(BaseModel):
    """Unstructured text information that couldn't be categorized."""

    achievements: Optional[str] = Field(
        None,
        description="Markdown-formatted achievements, one per line with bullet points",
    )
    additional_context: Optional[str] = None


class LayoutSettings(BaseModel):
    """Layout preference settings for portfolio display."""

    layout_mode: Optional[str] = Field(
        default="both",
        description="Available layout modes: chat-only, traditional-only, both",
    )
    default_layout: Optional[str] = Field(
        default="chat",
        description="Default layout when both are available: chat, traditional",
    )


class PortfolioMetadata(BaseModel):
    """Metadata about the portfolio data extraction."""

    source_type: Optional[str] = Field(
        None, description="Source type (e.g., resume_pdf, linkedin_pdf, github_only)"
    )
    extracted_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="ISO timestamp of when data was extracted",
    )
    notes: Optional[str] = None


class PortfolioData(BaseModel):
    """
    Complete portfolio data structure for AI-extracted user information.

    This is the root model that contains all user portfolio information
    extracted from PDFs and GitHub repositories. All fields are optional
    to handle incomplete or missing information from unstructured sources.
    """

    personal_info: Optional[PersonalInfo] = Field(default_factory=PersonalInfo)
    work_experiences: Optional[List[WorkExperience]] = Field(default_factory=list)
    projects: Optional[List[Project]] = Field(default_factory=list)
    education: Optional[List[Education]] = Field(default_factory=list)
    certifications: Optional[List[Certification]] = Field(default_factory=list)
    text_blobs: Optional[TextBlobs] = Field(default_factory=TextBlobs)
    metadata: Optional[PortfolioMetadata] = Field(default_factory=PortfolioMetadata)
    layout_settings: Optional[LayoutSettings] = Field(default_factory=LayoutSettings)

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat() + "Z"},
        json_schema_extra={
            "example": {
                "personal_info": {
                    "full_name": "John Doe",
                    "headline": "Senior Software Engineer",
                    "summary": "Experienced developer with 5+ years in web development",
                    "email": "john.doe@example.com",
                    "location": "San Francisco, CA",
                    "profile_photo_url": "https://storage.azure.com/user123/profile-photo.webp",
                    "profiles": [
                        {
                            "type": "linkedin",
                            "url": "https://linkedin.com/in/johndoe",
                            "label": "LinkedIn Profile",
                        }
                    ],
                },
                "work_experiences": [
                    {
                        "organization": "Tech Corp",
                        "title": "Senior Software Engineer",
                        "location": "San Francisco, CA",
                        "start_date": {"month": 1, "year": 2020},
                        "end_date": {"month": 12, "year": 2023},
                        "is_current": False,
                        "highlights": "- Led team of 5 developers\n- Increased performance by 40%\n- Implemented CI/CD pipeline",
                        "technologies": ["Python", "React", "PostgreSQL"],
                    }
                ],
                "projects": [
                    {
                        "name": "Portfolio Website",
                        "highlights": "- Built responsive design\n- Implemented CI/CD\n- Optimized for performance",
                        "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
                        "github": "https://github.com/johndoe/portfolio",
                        "live_link": "https://johndoe.dev",
                        "demo_video": "https://youtube.com/watch?v=abc123",
                        "more_context": "A modern portfolio website built with Next.js and TypeScript. Features include dark mode, responsive design, and optimized performance.",
                        "images": [
                            {
                                "url": "https://storage.azure.com/user123/projects/1234_screenshot1.webp",
                                "caption": "Homepage design",
                                "order": 0,
                            },
                            {
                                "url": "https://storage.azure.com/user123/projects/1235_screenshot2.webp",
                                "caption": "Project gallery",
                                "order": 1,
                            },
                        ],
                    }
                ],
                "education": [
                    {
                        "institution": "University of California",
                        "degree": "Bachelor of Science",
                        "branch": "Computer Science",
                        "start_date": {"month": 9, "year": 2016},
                        "end_date": {"month": 6, "year": 2020},
                        "location": "Berkeley, CA",
                        "grade": "3.8 GPA",
                    }
                ],
                "certifications": [
                    {
                        "name": "AWS Certified Solutions Architect",
                        "issuer": "Amazon Web Services",
                        "link": "https://aws.amazon.com/certification/",
                    }
                ],
                "text_blobs": {
                    "achievements": "- Won first place in hackathon\n- Published research paper\n- Contributed to open source projects",
                    "additional_context": "Additional information about the candidate",
                },
                "metadata": {
                    "source_type": "resume_pdf",
                    "extracted_at": "2024-01-15T10:30:00Z",
                    "notes": "Extracted from resume PDF with high confidence",
                },
                "layout_settings": {
                    "layout_mode": "both",
                    "default_layout": "chat",
                },
            }
        },
    )
