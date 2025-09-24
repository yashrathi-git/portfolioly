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
    tags: Optional[List[str]] = Field(default_factory=list)
    more_context: Optional[str] = None


class PersonalInfo(BaseModel):
    """Personal information section of the portfolio."""

    full_name: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profiles: Optional[List[Profile]] = Field(default_factory=list)


class WorkExperience(BaseModel):
    """Work experience entry with structured dates."""

    organization: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    highlights: Optional[List[str]] = Field(default_factory=list)
    technologies: Optional[List[str]] = Field(default_factory=list)
    more_context: Optional[str] = None


class Project(BaseModel):
    """Project information with links and technologies."""

    name: Optional[str] = None
    role: Optional[str] = None
    highlights: Optional[List[str]] = Field(default_factory=list)
    technologies: Optional[List[str]] = Field(default_factory=list)
    github: Optional[str] = None
    live_link: Optional[str] = None
    more_context: Optional[str] = None


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
    link: Optional[str] = None


class TextBlobs(BaseModel):
    """Unstructured text information that couldn't be categorized."""

    achievements: Optional[str] = None
    additional_context: Optional[str] = None


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
                        "highlights": [
                            "Led team of 5 developers",
                            "Increased performance by 40%",
                        ],
                        "technologies": ["Python", "React", "PostgreSQL"],
                    }
                ],
                "projects": [
                    {
                        "name": "Portfolio Website",
                        "role": "Full Stack Developer",
                        "highlights": ["Built responsive design", "Implemented CI/CD"],
                        "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
                        "github": "https://github.com/johndoe/portfolio",
                        "live_link": "https://johndoe.dev",
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
                "metadata": {
                    "source_type": "resume_pdf",
                    "extracted_at": "2024-01-15T10:30:00Z",
                    "notes": "Extracted from resume PDF with high confidence",
                },
            }
        },
    )
