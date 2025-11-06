"""Integration tests for LinkedIn profile parsing."""

import pytest
from extraction.api import parse_profile


class TestProfileParsing:
    """Test complete profile parsing functionality."""

    def test_software_engineer_profile(self, profile_001):
        """Test parsing of software engineer profile."""
        result = parse_profile(profile_001)

        # Basic info
        assert result["name"] == "Alex Chen"
        assert "TechCorp" in result["headline"]
        assert result["location"] == "Seattle, Washington, United States"

        # Contact
        assert result["contact"]["phone"] == "5551234567"
        assert result["contact"]["email"] == "alex.chen@example.com"
        assert "linkedin.com" in result["contact"]["LinkedIn"]
        assert "github.com" in result["contact"]["Other"]

        # Skills
        assert len(result["top_skills"]) == 3
        assert "Machine Learning" in result["top_skills"]

        # Certifications
        assert len(result["certifications"]) == 2
        assert "AWS Solutions Architect Associate" in result["certifications"]

        # Honors & Awards
        assert len(result["honors_awards"]) == 3
        assert any("TechCrunch" in award for award in result["honors_awards"])

        # Experience
        assert len(result["experience"]) == 3
        assert result["experience"][0]["type"] == "standalone_role"
        assert result["experience"][0]["duration_months"] == 3

        # Education
        assert len(result["education"]) == 2
        assert "State University" in result["education"][0]["institution"]

        # Summary
        assert result["summary"] is not None
        assert "Alex" in result["summary"]

    def test_researcher_profile(self, profile_002):
        """Test parsing of researcher profile."""
        result = parse_profile(profile_002)

        # Basic info
        assert result["name"] == "Maria Rodriguez PhD"
        assert "DataScience Academy" in result["headline"]
        assert result["location"] == "Austin, Texas, United States"

        # Contact
        assert "linkedin.com" in result["contact"]["LinkedIn"]
        assert "researchlab.org" in result["contact"]["Company"]

        # Skills
        assert len(result["top_skills"]) == 3
        assert "Data Science" in result["top_skills"]

        # Experience - should have multiple entries including company groups
        assert len(result["experience"]) > 5
        company_groups = [
            exp for exp in result["experience"] if exp["type"] == "company_group"
        ]
        assert len(company_groups) > 0

        # Education - multiple degrees
        assert len(result["education"]) >= 4
        phd_entries = [
            edu for edu in result["education"] if "Ph.D." in edu.get("degree", "")
        ]
        assert len(phd_entries) > 0

        # Summary
        assert result["summary"] is not None
        assert "data science" in result["summary"].lower()

    def test_analyst_profile(self, profile_003):
        """Test parsing of analyst profile."""
        result = parse_profile(profile_003)

        # Basic info
        assert result["name"] == "Jordan Kim"
        assert "FinTech Solutions" in result["headline"]
        assert result["location"] == "New York, New York, United States"

        # Contact
        assert "linkedin.com" in result["contact"]["LinkedIn"]

        # Skills
        assert len(result["top_skills"]) == 3
        assert "Business Analytics" in result["top_skills"]

        # Languages
        assert len(result["languages"]) == 2
        korean = next(
            (lang for lang in result["languages"] if lang["language"] == "Korean"), None
        )
        assert korean is not None
        assert korean["proficiency_level"] == "Native or Bilingual"

        # Certifications
        assert len(result["certifications"]) == 2

        # Honors & Awards
        assert len(result["honors_awards"]) == 5

        # Experience - should have nested roles
        assert len(result["experience"]) > 3
        company_groups = [
            exp for exp in result["experience"] if exp["type"] == "company_group"
        ]
        assert len(company_groups) > 0

        # Education
        assert len(result["education"]) >= 3


class TestSectionCoverage:
    """Test that all major sections are parsed correctly."""

    @pytest.mark.parametrize(
        "profile_fixture", ["profile_001", "profile_002", "profile_003"]
    )
    def test_core_sections_present(self, profile_fixture, request):
        """Test that core sections are always present."""
        profile_text = request.getfixturevalue(profile_fixture)
        result = parse_profile(profile_text)

        # Core sections that should always be present
        assert result["name"] is not None
        assert result["headline"] is not None
        assert result["location"] is not None
        assert result["contact"] is not None
        assert len(result["experience"]) > 0
        assert len(result["education"]) > 0

    def test_optional_sections_handling(self, profile_001, profile_002, profile_003):
        """Test that optional sections are handled correctly."""
        # Profile 001 has certifications but no languages
        result_001 = parse_profile(profile_001)
        assert len(result_001["certifications"]) > 0
        assert len(result_001["languages"]) == 0

        # Profile 002 has no certifications or languages
        result_002 = parse_profile(profile_002)
        assert len(result_002["certifications"]) == 0
        assert len(result_002["languages"]) == 0

        # Profile 003 has both
        result_003 = parse_profile(profile_003)
        assert len(result_003["certifications"]) > 0
        assert len(result_003["languages"]) > 0


class TestExperienceParsing:
    """Test experience section parsing details."""

    def test_standalone_roles(self, profile_001):
        """Test parsing of standalone role entries."""
        result = parse_profile(profile_001)

        standalone_roles = [
            exp for exp in result["experience"] if exp["type"] == "standalone_role"
        ]
        assert len(standalone_roles) == 3

        # Check first role
        first_role = standalone_roles[0]
        assert first_role["company_name"] == "TechCorp"
        assert first_role["title"] == "Software Engineering Intern"
        assert first_role["duration_months"] == 3
        assert first_role["start_date"] == "2024-06-01"
        assert first_role["end_date"] == "2024-08-01"

    def test_company_groups(self, profile_002):
        """Test parsing of company group entries with multiple roles."""
        result = parse_profile(profile_002)

        company_groups = [
            exp for exp in result["experience"] if exp["type"] == "company_group"
        ]
        assert len(company_groups) > 0

        # Check that company groups have roles
        for group in company_groups:
            assert "roles" in group
            assert len(group["roles"]) > 0
            assert "duration_months" in group

    def test_date_parsing(self, profile_001):
        """Test that dates are parsed correctly."""
        result = parse_profile(profile_001)

        for exp in result["experience"]:
            if exp["type"] == "standalone_role":
                assert "start_date" in exp
                assert "duration_months" in exp
                # Check date format (YYYY-MM-DD)
                if exp.get("start_date"):
                    assert len(exp["start_date"]) == 10
                    assert exp["start_date"][4] == "-"
                    assert exp["start_date"][7] == "-"


class TestEducationParsing:
    """Test education section parsing details."""

    def test_education_entries(self, profile_001):
        """Test basic education entry parsing."""
        result = parse_profile(profile_001)

        assert len(result["education"]) == 2

        # Check university entry
        university = result["education"][0]
        assert university["institution"] == "State University"
        assert "Bachelor" in university["degree"]
        assert "Computer Science" in university["degree"]

    def test_multiple_degrees(self, profile_002):
        """Test parsing of multiple degrees."""
        result = parse_profile(profile_002)

        assert len(result["education"]) >= 4

        # Should have PhD
        degrees = [edu.get("degree", "") for edu in result["education"]]
        assert any("Ph.D." in degree for degree in degrees)


class TestContactParsing:
    """Test contact information parsing."""

    def test_multiple_contact_methods(self, profile_001):
        """Test parsing of multiple contact methods."""
        result = parse_profile(profile_001)

        contact = result["contact"]
        assert "phone" in contact
        assert "email" in contact
        assert "LinkedIn" in contact
        assert "Other" in contact

    def test_linkedin_only_contact(self, profile_003):
        """Test profile with only LinkedIn contact."""
        result = parse_profile(profile_003)

        contact = result["contact"]
        assert "LinkedIn" in contact
        # Should not have phone or email
        assert "phone" not in contact or contact["phone"] is None


class TestLanguageParsing:
    """Test language section parsing."""

    def test_language_proficiency(self, profile_003):
        """Test parsing of languages with proficiency levels."""
        result = parse_profile(profile_003)

        assert len(result["languages"]) == 2

        # Check Korean entry
        korean = next(
            (lang for lang in result["languages"] if lang["language"] == "Korean"), None
        )
        assert korean is not None
        assert korean["proficiency_level"] == "Native or Bilingual"

        # Check English entry
        english = next(
            (lang for lang in result["languages"] if lang["language"] == "English"),
            None,
        )
        assert english is not None
        assert english["proficiency_level"] == "Full Professional"
