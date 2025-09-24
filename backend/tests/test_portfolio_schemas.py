"""
Unit tests for portfolio schema models.

Tests validation, serialization, and edge cases for the portfolio data models.
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.portfolio import (
    DateInfo,
    Profile,
    PersonalInfo,
    WorkExperience,
    Project,
    Education,
    Certification,
    TextBlobs,
    PortfolioMetadata,
    PortfolioData,
    ProfileType,
)


class TestDateInfo:
    """Test DateInfo model validation."""

    def test_valid_date_info(self):
        """Test valid date information."""
        date_info = DateInfo(month=6, year=2023)
        assert date_info.month == 6
        assert date_info.year == 2023

    def test_optional_fields(self):
        """Test that all fields are optional."""
        date_info = DateInfo()
        assert date_info.month is None
        assert date_info.year is None

    def test_month_validation(self):
        """Test month validation boundaries."""
        # Valid months
        DateInfo(month=1, year=2023)
        DateInfo(month=12, year=2023)

        # Invalid months
        with pytest.raises(ValidationError):
            DateInfo(month=0, year=2023)

        with pytest.raises(ValidationError):
            DateInfo(month=13, year=2023)

    def test_year_validation(self):
        """Test year validation boundaries."""
        # Valid years
        DateInfo(month=6, year=1900)
        DateInfo(month=6, year=2100)

        # Invalid years
        with pytest.raises(ValidationError):
            DateInfo(month=6, year=1899)

        with pytest.raises(ValidationError):
            DateInfo(month=6, year=2101)


class TestProfile:
    """Test Profile model validation."""

    def test_valid_profile(self):
        """Test valid profile creation."""
        profile = Profile(
            type=ProfileType.LINKEDIN,
            url="https://linkedin.com/in/johndoe",
            label="LinkedIn Profile",
            tags=["professional", "networking"],
            more_context="Primary professional profile",
        )
        assert profile.type == ProfileType.LINKEDIN
        assert profile.url == "https://linkedin.com/in/johndoe"
        assert profile.label == "LinkedIn Profile"
        assert profile.tags == ["professional", "networking"]
        assert profile.more_context == "Primary professional profile"

    def test_optional_fields(self):
        """Test that all fields are optional."""
        profile = Profile()
        assert profile.type is None
        assert profile.url is None
        assert profile.label is None
        assert profile.tags == []
        assert profile.more_context is None

    def test_profile_type_enum(self):
        """Test ProfileType enum values."""
        valid_types = [
            ProfileType.LINKEDIN,
            ProfileType.GITHUB,
            ProfileType.WEBSITE,
            ProfileType.PORTFOLIO,
            ProfileType.YOUTUBE,
            ProfileType.TWITTER,
            ProfileType.SCHOLAR,
            ProfileType.OTHER,
        ]

        for profile_type in valid_types:
            profile = Profile(type=profile_type)
            assert profile.type == profile_type


class TestPersonalInfo:
    """Test PersonalInfo model validation."""

    def test_valid_personal_info(self):
        """Test valid personal info creation."""
        personal_info = PersonalInfo(
            full_name="John Doe",
            headline="Senior Software Engineer",
            summary="Experienced developer",
            email="john@example.com",
            phone="+1-555-0123",
            location="San Francisco, CA",
            profiles=[
                Profile(
                    type=ProfileType.LINKEDIN, url="https://linkedin.com/in/johndoe"
                )
            ],
        )
        assert personal_info.full_name == "John Doe"
        assert personal_info.headline == "Senior Software Engineer"
        assert len(personal_info.profiles) == 1

    def test_optional_fields(self):
        """Test that all fields are optional."""
        personal_info = PersonalInfo()
        assert personal_info.full_name is None
        assert personal_info.profiles == []


class TestWorkExperience:
    """Test WorkExperience model validation."""

    def test_valid_work_experience(self):
        """Test valid work experience creation."""
        work_exp = WorkExperience(
            organization="Tech Corp",
            title="Senior Engineer",
            location="San Francisco, CA",
            start_date=DateInfo(month=1, year=2020),
            end_date=DateInfo(month=12, year=2023),
            is_current=False,
            highlights=["Led team", "Improved performance"],
            technologies=["Python", "React"],
            more_context="Great experience",
        )
        assert work_exp.organization == "Tech Corp"
        assert work_exp.start_date.month == 1
        assert work_exp.start_date.year == 2020
        assert len(work_exp.highlights) == 2
        assert len(work_exp.technologies) == 2

    def test_optional_fields(self):
        """Test that all fields are optional."""
        work_exp = WorkExperience()
        assert work_exp.organization is None
        assert work_exp.highlights == []
        assert work_exp.technologies == []


class TestProject:
    """Test Project model validation."""

    def test_valid_project(self):
        """Test valid project creation."""
        project = Project(
            name="Portfolio Website",
            role="Full Stack Developer",
            highlights=["Responsive design", "CI/CD pipeline"],
            technologies=["Next.js", "TypeScript"],
            github="https://github.com/user/project",
            live_link="https://project.com",
            more_context="Personal project",
        )
        assert project.name == "Portfolio Website"
        assert project.role == "Full Stack Developer"
        assert len(project.highlights) == 2
        assert len(project.technologies) == 2

    def test_optional_fields(self):
        """Test that all fields are optional."""
        project = Project()
        assert project.name is None
        assert project.highlights == []
        assert project.technologies == []


class TestEducation:
    """Test Education model validation."""

    def test_valid_education(self):
        """Test valid education creation."""
        education = Education(
            institution="University of California",
            degree="Bachelor of Science",
            branch="Computer Science",
            start_date=DateInfo(month=9, year=2016),
            end_date=DateInfo(month=6, year=2020),
            is_current=False,
            location="Berkeley, CA",
            grade="3.8 GPA",
        )
        assert education.institution == "University of California"
        assert education.degree == "Bachelor of Science"
        assert education.branch == "Computer Science"
        assert education.start_date.month == 9

    def test_optional_fields(self):
        """Test that all fields are optional."""
        education = Education()
        assert education.institution is None
        assert education.degree is None


class TestCertification:
    """Test Certification model validation."""

    def test_valid_certification(self):
        """Test valid certification creation."""
        cert = Certification(
            name="AWS Solutions Architect", link="https://aws.amazon.com/certification/"
        )
        assert cert.name == "AWS Solutions Architect"
        assert cert.link == "https://aws.amazon.com/certification/"

    def test_optional_fields(self):
        """Test that all fields are optional."""
        cert = Certification()
        assert cert.name is None
        assert cert.link is None


class TestTextBlobs:
    """Test TextBlobs model validation."""

    def test_valid_text_blobs(self):
        """Test valid text blobs creation."""
        text_blobs = TextBlobs(
            achievements="Won hackathon 2023",
            additional_context="Passionate about open source",
        )
        assert text_blobs.achievements == "Won hackathon 2023"
        assert text_blobs.additional_context == "Passionate about open source"

    def test_optional_fields(self):
        """Test that all fields are optional."""
        text_blobs = TextBlobs()
        assert text_blobs.achievements is None
        assert text_blobs.additional_context is None


class TestPortfolioMetadata:
    """Test PortfolioMetadata model validation."""

    def test_valid_metadata(self):
        """Test valid metadata creation."""
        metadata = PortfolioMetadata(
            source_type="resume_pdf", notes="High confidence extraction"
        )
        assert metadata.source_type == "resume_pdf"
        assert metadata.notes == "High confidence extraction"
        assert isinstance(metadata.extracted_at, datetime)

    def test_optional_fields(self):
        """Test that all fields are optional."""
        metadata = PortfolioMetadata()
        assert metadata.source_type is None
        assert metadata.notes is None
        assert isinstance(metadata.extracted_at, datetime)


class TestPortfolioData:
    """Test PortfolioData root model validation."""

    def test_valid_portfolio_data(self):
        """Test valid complete portfolio data creation."""
        portfolio = PortfolioData(
            personal_info=PersonalInfo(full_name="John Doe", email="john@example.com"),
            work_experiences=[
                WorkExperience(
                    organization="Tech Corp",
                    title="Engineer",
                    start_date=DateInfo(month=1, year=2020),
                )
            ],
            projects=[Project(name="Test Project", technologies=["Python", "FastAPI"])],
            education=[
                Education(institution="University", degree="BS Computer Science")
            ],
            certifications=[Certification(name="AWS Certified")],
            text_blobs=TextBlobs(achievements="Multiple awards"),
            metadata=PortfolioMetadata(source_type="resume_pdf"),
        )

        assert portfolio.personal_info.full_name == "John Doe"
        assert len(portfolio.work_experiences) == 1
        assert len(portfolio.projects) == 1
        assert len(portfolio.education) == 1
        assert len(portfolio.certifications) == 1
        assert portfolio.text_blobs.achievements == "Multiple awards"
        assert portfolio.metadata.source_type == "resume_pdf"

    def test_empty_portfolio_data(self):
        """Test empty portfolio data with default values."""
        portfolio = PortfolioData()

        assert isinstance(portfolio.personal_info, PersonalInfo)
        assert portfolio.work_experiences == []
        assert portfolio.projects == []
        assert portfolio.education == []
        assert portfolio.certifications == []
        assert isinstance(portfolio.text_blobs, TextBlobs)
        assert isinstance(portfolio.metadata, PortfolioMetadata)

    def test_json_serialization(self):
        """Test JSON serialization of portfolio data."""
        portfolio = PortfolioData(
            personal_info=PersonalInfo(full_name="John Doe"),
            metadata=PortfolioMetadata(source_type="resume_pdf"),
        )

        json_data = portfolio.model_dump()
        assert json_data["personal_info"]["full_name"] == "John Doe"
        assert json_data["metadata"]["source_type"] == "resume_pdf"
        assert "extracted_at" in json_data["metadata"]

    def test_model_validation_with_invalid_data(self):
        """Test model validation with invalid nested data."""
        with pytest.raises(ValidationError):
            PortfolioData(
                work_experiences=[
                    WorkExperience(
                        start_date=DateInfo(month=13, year=2020)  # Invalid month
                    )
                ]
            )
