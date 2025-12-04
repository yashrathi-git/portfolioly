"""
Resume data schema models for the Resume Builder feature.

This module defines Pydantic models for the structured resume data
optimized for resume formatting with array-based highlights,
categorized skills, and section ordering.
"""

from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class SectionType(str, Enum):
    """Section types for resume ordering."""

    SUMMARY = "summary"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    PROJECTS = "projects"
    SKILLS = "skills"
    CERTIFICATIONS = "certifications"


# Default section order for new resumes
DEFAULT_SECTION_ORDER: List[SectionType] = [
    SectionType.SUMMARY,
    SectionType.EXPERIENCE,
    SectionType.EDUCATION,
    SectionType.PROJECTS,
    SectionType.SKILLS,
    SectionType.CERTIFICATIONS,
]


class ResumeDateInfo(BaseModel):
    """Structured date information for resume entries."""

    month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    year: Optional[int] = Field(None, ge=1900, le=2100, description="4-digit year")


class ResumePersonalInfo(BaseModel):
    """Personal information section of the resume."""

    full_name: str = Field(..., min_length=1, description="Full name (required)")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    location: Optional[str] = Field(None, description="Location/city")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL")
    github_url: Optional[str] = Field(None, description="GitHub profile URL")
    website_url: Optional[str] = Field(None, description="Personal website URL")


class ResumeWorkExperience(BaseModel):
    """Work experience entry with bullet point highlights."""

    id: str = Field(..., description="Unique identifier")
    company: str = Field(..., min_length=1, description="Company name")
    title: str = Field(..., min_length=1, description="Job title")
    location: Optional[str] = Field(None, description="Job location")
    start_date: ResumeDateInfo = Field(..., description="Start date")
    end_date: Optional[ResumeDateInfo] = Field(
        None, description="End date (null if current)"
    )
    is_current: bool = Field(False, description="Whether this is current position")
    highlights: List[str] = Field(
        default_factory=list, description="Array of bullet points for resume formatting"
    )


class ResumeEducation(BaseModel):
    """Education entry with optional GPA and highlights."""

    id: str = Field(..., description="Unique identifier")
    institution: str = Field(..., min_length=1, description="Institution name")
    degree: str = Field(..., min_length=1, description="Degree name")
    field: Optional[str] = Field(None, description="Field of study")
    location: Optional[str] = Field(None, description="Institution location")
    start_date: ResumeDateInfo = Field(..., description="Start date")
    end_date: Optional[ResumeDateInfo] = Field(None, description="End date")
    gpa: Optional[str] = Field(None, description="GPA or grade")
    highlights: List[str] = Field(
        default_factory=list, description="Array of achievements or highlights"
    )


class ResumeProject(BaseModel):
    """Project entry for resume."""

    id: str = Field(..., description="Unique identifier")
    name: str = Field(..., min_length=1, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    technologies: List[str] = Field(
        default_factory=list, description="Technologies used"
    )
    url: Optional[str] = Field(None, description="Project URL")
    highlights: List[str] = Field(
        default_factory=list, description="Array of project highlights"
    )


class SkillCategory(BaseModel):
    """Skill category for grouped skills display."""

    name: str = Field(
        ..., min_length=1, description="Category name (e.g., Languages, Frameworks)"
    )
    items: List[str] = Field(
        default_factory=list, description="Skills in this category"
    )


class ResumeSkills(BaseModel):
    """Skills section with categorized skill groups."""

    categories: List[SkillCategory] = Field(
        default_factory=list, description="List of skill categories"
    )


class ResumeCertification(BaseModel):
    """Certification entry."""

    id: str = Field(..., description="Unique identifier")
    name: str = Field(..., min_length=1, description="Certification name")
    issuer: Optional[str] = Field(None, description="Issuing organization")
    date: Optional[str] = Field(None, description="Date obtained")


class ResumeData(BaseModel):
    """
    Main ResumeData schema for storing and rendering resumes.

    This is the root model that contains all resume information
    optimized for resume formatting with array-based highlights,
    categorized skills, and section ordering.
    """

    id: str = Field(..., description="Unique identifier")
    name: str = Field(
        ..., min_length=1, description="User-defined name for this resume version"
    )
    template_id: str = Field(..., description="Selected template ID")
    section_order: List[SectionType] = Field(
        default_factory=lambda: list(DEFAULT_SECTION_ORDER),
        description="Order of sections in the resume",
    )

    personal_info: ResumePersonalInfo = Field(
        ..., description="Personal/contact information"
    )
    summary: Optional[str] = Field(
        None, description="Professional summary or objective"
    )
    work_experiences: List[ResumeWorkExperience] = Field(
        default_factory=list, description="Work experience entries"
    )
    education: List[ResumeEducation] = Field(
        default_factory=list, description="Education entries"
    )
    projects: List[ResumeProject] = Field(
        default_factory=list, description="Project entries"
    )
    skills: ResumeSkills = Field(
        default_factory=ResumeSkills, description="Categorized skills"
    )
    certifications: List[ResumeCertification] = Field(
        default_factory=list, description="Certifications"
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="ISO timestamp of creation"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="ISO timestamp of last update"
    )

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat() + "Z"},
        json_schema_extra={
            "example": {
                "id": "resume_abc123",
                "name": "Software Engineer Resume",
                "template_id": "classic",
                "section_order": [
                    "summary",
                    "experience",
                    "education",
                    "projects",
                    "skills",
                    "certifications",
                ],
                "personal_info": {
                    "full_name": "John Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1 (555) 123-4567",
                    "location": "San Francisco, CA",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                    "github_url": "https://github.com/johndoe",
                    "website_url": "https://johndoe.dev",
                },
                "summary": "Experienced software engineer with 5+ years in web development",
                "work_experiences": [
                    {
                        "id": "exp_1",
                        "company": "Tech Corp",
                        "title": "Senior Software Engineer",
                        "location": "San Francisco, CA",
                        "start_date": {"month": 1, "year": 2020},
                        "end_date": None,
                        "is_current": True,
                        "highlights": [
                            "Led team of 5 developers",
                            "Increased performance by 40%",
                            "Implemented CI/CD pipeline",
                        ],
                    }
                ],
                "education": [
                    {
                        "id": "edu_1",
                        "institution": "University of California",
                        "degree": "Bachelor of Science",
                        "field": "Computer Science",
                        "location": "Berkeley, CA",
                        "start_date": {"month": 9, "year": 2016},
                        "end_date": {"month": 6, "year": 2020},
                        "gpa": "3.8",
                        "highlights": ["Dean's List", "Graduated with Honors"],
                    }
                ],
                "projects": [
                    {
                        "id": "proj_1",
                        "name": "Portfolio Website",
                        "description": "Personal portfolio built with Next.js",
                        "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
                        "url": "https://johndoe.dev",
                        "highlights": [
                            "Built responsive design",
                            "Optimized for performance",
                        ],
                    }
                ],
                "skills": {
                    "categories": [
                        {
                            "name": "Languages",
                            "items": ["Python", "TypeScript", "JavaScript"],
                        },
                        {
                            "name": "Frameworks",
                            "items": ["React", "Next.js", "FastAPI"],
                        },
                        {"name": "Tools", "items": ["Git", "Docker", "AWS"]},
                    ]
                },
                "certifications": [
                    {
                        "id": "cert_1",
                        "name": "AWS Certified Solutions Architect",
                        "issuer": "Amazon Web Services",
                        "date": "2023",
                    }
                ],
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
            }
        },
    )


class ResumeSummary(BaseModel):
    """Summary view of a resume for list displays."""

    id: str = Field(..., description="Unique identifier")
    name: str = Field(..., description="Resume name")
    template_id: str = Field(..., description="Selected template ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat() + "Z"})


class CreateResumeRequest(BaseModel):
    """Request payload for creating a new resume."""

    name: str = Field(..., min_length=1, description="Resume name")
    template_id: Optional[str] = Field("classic", description="Template ID")
    personal_info: ResumePersonalInfo = Field(..., description="Personal information")
    summary: Optional[str] = Field(None, description="Professional summary")
    work_experiences: List[ResumeWorkExperience] = Field(
        default_factory=list, description="Work experiences"
    )
    education: List[ResumeEducation] = Field(
        default_factory=list, description="Education entries"
    )
    projects: List[ResumeProject] = Field(default_factory=list, description="Projects")
    skills: Optional[ResumeSkills] = Field(
        default_factory=ResumeSkills, description="Skills"
    )
    certifications: List[ResumeCertification] = Field(
        default_factory=list, description="Certifications"
    )
    section_order: List[SectionType] = Field(
        default_factory=lambda: list(DEFAULT_SECTION_ORDER), description="Section order"
    )


class UpdateResumeRequest(BaseModel):
    """Request payload for updating an existing resume."""

    name: Optional[str] = Field(None, min_length=1, description="Resume name")
    template_id: Optional[str] = Field(None, description="Template ID")
    section_order: Optional[List[SectionType]] = Field(
        None, description="Section order"
    )
    personal_info: Optional[ResumePersonalInfo] = Field(
        None, description="Personal information"
    )
    summary: Optional[str] = Field(None, description="Professional summary")
    work_experiences: Optional[List[ResumeWorkExperience]] = Field(
        None, description="Work experiences"
    )
    education: Optional[List[ResumeEducation]] = Field(
        None, description="Education entries"
    )
    projects: Optional[List[ResumeProject]] = Field(None, description="Projects")
    skills: Optional[ResumeSkills] = Field(None, description="Skills")
    certifications: Optional[List[ResumeCertification]] = Field(
        None, description="Certifications"
    )


class ResumeListResponse(BaseModel):
    """Response for listing user's resumes."""

    resumes: List[ResumeSummary] = Field(..., description="List of resume summaries")
    total: int = Field(..., description="Total number of resumes")
