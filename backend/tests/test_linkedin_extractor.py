"""Tests for LinkedIn PDF extraction service."""

import pytest
from app.services.linkedin_extractor import LinkedInExtractor
from app.schemas.portfolio import (
    WorkExperience,
    DateInfo,
    Education,
    Certification,
    PortfolioData,
    PersonalInfo,
    TextBlobs,
)


class TestLinkedInExtractor:
    """Test suite for LinkedInExtractor service."""

    def setup_method(self):
        """Set up test fixtures."""
        self.extractor = LinkedInExtractor()

    def test_map_work_experiences_with_company_group(self):
        """Test mapping work experiences with company groups."""
        experiences = [
            {
                "type": "company_group",
                "company_name": "Tech Corp",
                "duration_text": "3 years 6 months",
                "duration_months": 42,
                "roles": [
                    {
                        "title": "Senior Engineer",
                        "start_date": "2021-01-01",
                        "end_date": "2023-06-01",
                        "is_current": False,
                        "location": "San Francisco, CA",
                        "highlights": "Led team of 5 engineers\nBuilt scalable systems",
                    },
                    {
                        "title": "Engineer",
                        "start_date": "2020-01-01",
                        "end_date": "2021-01-01",
                        "is_current": False,
                        "location": "San Francisco, CA",
                        "highlights": "Developed features",
                    },
                ],
            }
        ]

        result = self.extractor._map_work_experiences(experiences)

        assert len(result) == 2
        assert all(isinstance(exp, WorkExperience) for exp in result)

        # Check first role
        assert result[0].organization == "Tech Corp"
        assert result[0].title == "Senior Engineer"
        assert result[0].location == "San Francisco, CA"
        assert result[0].start_date == DateInfo(month=1, year=2021)
        assert result[0].end_date == DateInfo(month=6, year=2023)
        assert result[0].is_current is False
        assert "Led team of 5 engineers" in result[0].highlights

        # Check second role
        assert result[1].organization == "Tech Corp"
        assert result[1].title == "Engineer"

    def test_map_work_experiences_with_standalone_role(self):
        """Test mapping standalone work experience."""
        experiences = [
            {
                "type": "standalone_role",
                "company_name": "Startup Inc",
                "title": "Founder",
                "start_date": "2019-03-01",
                "end_date": None,
                "is_current": True,
                "location": "Remote",
                "highlights": "Built product from scratch",
            }
        ]

        result = self.extractor._map_work_experiences(experiences)

        assert len(result) == 1
        assert result[0].organization == "Startup Inc"
        assert result[0].title == "Founder"
        assert result[0].is_current is True
        assert result[0].start_date == DateInfo(month=3, year=2019)
        assert result[0].end_date is None

    def test_create_work_experience_with_company_override(self):
        """Test creating work experience with company override."""
        role_data = {
            "title": "Software Engineer",
            "start_date": "2020-06-01",
            "end_date": "2022-12-01",
            "is_current": False,
            "location": "New York, NY",
            "highlights": "Developed features",
        }

        result = self.extractor._create_work_experience(
            role_data, company_override="Big Tech"
        )

        assert result.organization == "Big Tech"
        assert result.title == "Software Engineer"
        assert result.location == "New York, NY"

    def test_parse_date_with_valid_iso_string(self):
        """Test parsing valid ISO date string."""
        result = self.extractor._parse_date("2023-05-15")

        assert result is not None
        assert result.year == 2023
        assert result.month == 5

    def test_parse_date_with_year_only(self):
        """Test parsing date with year only."""
        result = self.extractor._parse_date("2023-01-01")

        assert result is not None
        assert result.year == 2023
        assert result.month == 1

    def test_parse_date_with_none(self):
        """Test parsing None date."""
        result = self.extractor._parse_date(None)
        assert result is None

    def test_parse_date_with_invalid_format(self):
        """Test parsing invalid date format."""
        result = self.extractor._parse_date("invalid-date")
        assert result is None

    def test_map_work_experiences_empty_list(self):
        """Test mapping empty experience list."""
        result = self.extractor._map_work_experiences([])
        assert result == []

    def test_map_work_experiences_mixed_types(self):
        """Test mapping mixed company groups and standalone roles."""
        experiences = [
            {
                "type": "company_group",
                "company_name": "Company A",
                "roles": [
                    {
                        "title": "Role 1",
                        "start_date": "2020-01-01",
                        "end_date": "2021-01-01",
                        "is_current": False,
                    }
                ],
            },
            {
                "type": "standalone_role",
                "company_name": "Company B",
                "title": "Role 2",
                "start_date": "2019-01-01",
                "end_date": "2020-01-01",
                "is_current": False,
            },
        ]

        result = self.extractor._map_work_experiences(experiences)

        assert len(result) == 2
        assert result[0].organization == "Company A"
        assert result[0].title == "Role 1"
        assert result[1].organization == "Company B"
        assert result[1].title == "Role 2"

    def test_map_education_with_complete_data(self):
        """Test mapping education with all fields present."""
        education_list = [
            {
                "institution": "Stanford University",
                "degree": "Bachelor's degree in Computer Science",
                "start_date": "2018-09-01",
                "end_date": "2022-06-01",
                "start_date_text": "September 2018",
                "end_date_text": "June 2022",
                "duration_months": 45,
                "incomplete": False,
            }
        ]

        result = self.extractor._map_education(education_list)

        assert len(result) == 1
        assert isinstance(result[0], Education)
        assert result[0].institution == "Stanford University"
        assert result[0].degree == "Bachelor's degree in Computer Science"
        assert result[0].start_date == DateInfo(month=9, year=2018)
        assert result[0].end_date == DateInfo(month=6, year=2022)
        assert result[0].is_current is False

    def test_map_education_with_current_education(self):
        """Test mapping education that is currently in progress."""
        education_list = [
            {
                "institution": "MIT",
                "degree": "Master's degree in AI",
                "start_date": "2023-09-01",
                "end_date": None,
                "start_date_text": "September 2023",
                "end_date_text": "Present",
                "incomplete": False,
            }
        ]

        result = self.extractor._map_education(education_list)

        assert len(result) == 1
        assert result[0].institution == "MIT"
        assert result[0].is_current is True
        assert result[0].start_date == DateInfo(month=9, year=2023)
        assert result[0].end_date is None

    def test_map_education_with_minimal_data(self):
        """Test mapping education with only institution name."""
        education_list = [
            {
                "institution": "University of California",
                "degree": None,
                "start_date": None,
                "end_date": None,
                "incomplete": True,
            }
        ]

        result = self.extractor._map_education(education_list)

        assert len(result) == 1
        assert result[0].institution == "University of California"
        assert result[0].degree is None
        assert result[0].start_date is None
        assert result[0].end_date is None
        assert result[0].is_current is False

    def test_map_education_empty_list(self):
        """Test mapping empty education list."""
        result = self.extractor._map_education([])
        assert result == []

    def test_map_education_multiple_entries(self):
        """Test mapping multiple education entries."""
        education_list = [
            {
                "institution": "Harvard University",
                "degree": "PhD in Physics",
                "start_date": "2020-09-01",
                "end_date": "2024-06-01",
            },
            {
                "institution": "Yale University",
                "degree": "Bachelor's degree",
                "start_date": "2016-09-01",
                "end_date": "2020-05-01",
            },
        ]

        result = self.extractor._map_education(education_list)

        assert len(result) == 2
        assert result[0].institution == "Harvard University"
        assert result[0].degree == "PhD in Physics"
        assert result[1].institution == "Yale University"
        assert result[1].degree == "Bachelor's degree"

    def test_map_certifications_with_valid_names(self):
        """Test mapping certifications with valid names."""
        cert_list = [
            "AWS Certified Solutions Architect",
            "Google Cloud Professional",
            "Certified Kubernetes Administrator",
        ]

        result = self.extractor._map_certifications(cert_list)

        assert len(result) == 3
        assert all(isinstance(cert, Certification) for cert in result)
        assert result[0].name == "AWS Certified Solutions Architect"
        assert result[1].name == "Google Cloud Professional"
        assert result[2].name == "Certified Kubernetes Administrator"

    def test_map_certifications_with_whitespace(self):
        """Test mapping certifications with extra whitespace."""
        cert_list = [
            "  AWS Certified  ",
            "Google Cloud   ",
            "   Kubernetes Admin",
        ]

        result = self.extractor._map_certifications(cert_list)

        assert len(result) == 3
        assert result[0].name == "AWS Certified"
        assert result[1].name == "Google Cloud"
        assert result[2].name == "Kubernetes Admin"

    def test_map_certifications_empty_list(self):
        """Test mapping empty certification list."""
        result = self.extractor._map_certifications([])
        assert result == []

    def test_map_certifications_with_empty_strings(self):
        """Test mapping certifications with empty strings filtered out."""
        cert_list = [
            "Valid Certification",
            "",
            "   ",
            "Another Valid Cert",
        ]

        result = self.extractor._map_certifications(cert_list)

        assert len(result) == 2
        assert result[0].name == "Valid Certification"
        assert result[1].name == "Another Valid Cert"

    def test_map_certifications_single_entry(self):
        """Test mapping single certification."""
        cert_list = ["Deep Learning Specialization"]

        result = self.extractor._map_certifications(cert_list)

        assert len(result) == 1
        assert result[0].name == "Deep Learning Specialization"

    def test_map_to_portfolio_data_complete(self):
        """Test complete portfolio data mapping with all sections."""
        profile_data = {
            "name": "Jane Smith",
            "headline": "Senior Software Engineer",
            "location": "San Francisco, CA",
            "summary": "Experienced engineer with 10+ years in tech",
            "contact": {
                "email": "jane@example.com",
                "phone": "+1-555-0123",
                "linkedin": "https://linkedin.com/in/janesmith",
                "github": "https://github.com/janesmith",
            },
            "top_skills": ["Python", "JavaScript", "AWS"],
            "languages": [
                {"language": "English", "proficiency": "Native"},
                {"language": "Spanish", "proficiency": "Professional"},
            ],
            "experience": [
                {
                    "type": "standalone_role",
                    "company_name": "Tech Corp",
                    "title": "Senior Engineer",
                    "start_date": "2020-01-01",
                    "end_date": "2023-12-01",
                    "is_current": False,
                    "location": "San Francisco, CA",
                    "highlights": "Led team of 5 engineers",
                }
            ],
            "education": [
                {
                    "institution": "MIT",
                    "degree": "Bachelor of Science in Computer Science",
                    "start_date": "2010-09-01",
                    "end_date": "2014-06-01",
                }
            ],
            "certifications": [
                "AWS Certified Solutions Architect",
                "Google Cloud Professional",
            ],
            "honors_awards": ["Employee of the Year 2022", "Best Innovation Award"],
        }

        result = self.extractor._map_to_portfolio_data(profile_data)

        # Verify it returns a valid PortfolioData object
        assert isinstance(result, PortfolioData)

        # Verify personal info
        assert result.personal_info is not None
        assert result.personal_info.full_name == "Jane Smith"
        assert result.personal_info.headline == "Senior Software Engineer"
        assert result.personal_info.email == "jane@example.com"
        assert result.personal_info.phone == "+1-555-0123"
        assert result.personal_info.location == "San Francisco, CA"
        assert (
            result.personal_info.summary
            == "Experienced engineer with 10+ years in tech"
        )
        assert len(result.personal_info.profiles) == 2
        assert len(result.personal_info.tags) == 3

        # Verify work experiences
        assert len(result.work_experiences) == 1
        assert result.work_experiences[0].organization == "Tech Corp"
        assert result.work_experiences[0].title == "Senior Engineer"

        # Verify education
        assert len(result.education) == 1
        assert result.education[0].institution == "MIT"

        # Verify certifications
        assert len(result.certifications) == 2
        assert result.certifications[0].name == "AWS Certified Solutions Architect"

        # Verify text blobs
        assert result.text_blobs is not None
        assert "Employee of the Year 2022" in result.text_blobs.achievements
        assert "Languages:" in result.text_blobs.additional_context
        assert "English (Native)" in result.text_blobs.additional_context

        # Verify metadata
        assert result.metadata is not None
        assert result.metadata.source_type == "linkedin_direct_extraction"
        assert result.metadata.extracted_at is not None
        assert "without AI processing" in result.metadata.notes

        # Verify projects is None (LinkedIn PDFs don't have detailed project info)
        assert result.projects is None

    def test_map_to_portfolio_data_minimal(self):
        """Test portfolio data mapping with minimal data."""
        profile_data = {
            "name": "John Doe",
            "contact": {},
            "experience": [],
            "education": [],
            "certifications": [],
        }

        result = self.extractor._map_to_portfolio_data(profile_data)

        # Verify it returns a valid PortfolioData object
        assert isinstance(result, PortfolioData)

        # Verify personal info has at least the name
        assert result.personal_info is not None
        assert result.personal_info.full_name == "John Doe"

        # Verify empty lists
        assert result.work_experiences == []
        assert result.education == []
        assert result.certifications == []

        # Verify metadata is present
        assert result.metadata is not None
        assert result.metadata.source_type == "linkedin_direct_extraction"

    def test_map_to_portfolio_data_validates_schema(self):
        """Test that portfolio data mapping validates against schema."""
        profile_data = {
            "name": "Test User",
            "contact": {"email": "test@example.com"},
            "experience": [],
            "education": [],
            "certifications": [],
        }

        # This should not raise any validation errors
        result = self.extractor._map_to_portfolio_data(profile_data)

        # Verify the result can be serialized (validates schema)
        data_dict = result.model_dump()
        assert isinstance(data_dict, dict)
        assert "personal_info" in data_dict
        assert "metadata" in data_dict
