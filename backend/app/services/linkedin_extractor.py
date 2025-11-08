"""LinkedIn PDF extraction service for direct structured data extraction.

This service provides direct extraction of portfolio data from LinkedIn PDFs
using the pdf_parser package, bypassing AI processing for faster and more
cost-effective data extraction.
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Add pdf_parser package to Python path
PDF_PARSER_PATH = (
    Path(__file__).parent.parent.parent.parent / "packages" / "pdf_parser" / "src"
)
sys.path.insert(0, str(PDF_PARSER_PATH))

from extraction.api import parse_profile
from ..schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    WorkExperience,
    Education,
    Certification,
    Profile,
    DateInfo,
    Project,
    TextBlobs,
    PortfolioMetadata,
    ProfileType,
)
from ..schemas.github import GitHubRepo


class LinkedInExtractor:
    """Service for extracting structured data from LinkedIn markdown."""

    async def extract_from_markdown(
        self, markdown_text: str, github_repos: Optional[List[GitHubRepo]] = None
    ) -> PortfolioData:
        """
        Extract portfolio data from LinkedIn markdown and optionally merge with GitHub repos.

        Args:
            markdown_text: LinkedIn PDF content already converted to markdown
            github_repos: Optional list of GitHub repositories to merge

        Returns:
            PortfolioData object with extracted and merged information

        Raises:
            ValueError: If parsing fails
        """
        # Step 1: Parse markdown using pdf_parser package
        profile_data = parse_profile(markdown_text)

        # Step 2: Map to PortfolioData schema
        portfolio_data = self._map_to_portfolio_data(profile_data)

        # Step 3: Merge GitHub repos if provided
        if github_repos:
            portfolio_data = self._merge_github_repos(portfolio_data, github_repos)

        return portfolio_data

    def _map_to_portfolio_data(self, profile_data: Dict[str, Any]) -> PortfolioData:
        """Map pdf_parser output to PortfolioData schema.

        This method integrates all mapping methods to create a complete PortfolioData
        object with proper validation. The resulting object is automatically validated
        by Pydantic against the PortfolioData schema.

        Args:
            profile_data: Parsed profile data from pdf_parser package

        Returns:
            PortfolioData object with all mapped fields and metadata

        Raises:
            ValidationError: If the resulting data doesn't match the schema
        """

        # Extract personal info
        personal_info = self._map_personal_info(profile_data)

        # Extract work experiences
        work_experiences = self._map_work_experiences(
            profile_data.get("experience", [])
        )

        # Extract education
        education = self._map_education(profile_data.get("education", []))

        # Extract certifications
        certifications = self._map_certifications(
            profile_data.get("certifications", [])
        )

        # Extract text blobs for achievements
        text_blobs = self._map_text_blobs(profile_data)

        # Create metadata with source_type and extraction timestamp
        metadata = PortfolioMetadata(
            source_type="linkedin_direct_extraction",
            extracted_at=datetime.utcnow(),
            notes="Extracted directly from LinkedIn PDF without AI processing",
        )

        # Create and validate PortfolioData object
        # Pydantic automatically validates the data against the schema
        portfolio_data = PortfolioData(
            personal_info=personal_info,
            work_experiences=work_experiences,
            education=education,
            certifications=certifications,
            projects=None,  # LinkedIn PDFs typically don't have detailed project info
            text_blobs=text_blobs,
            metadata=metadata,
        )

        return portfolio_data

    def _map_personal_info(self, profile_data: Dict[str, Any]) -> PersonalInfo:
        """Map profile data to PersonalInfo."""
        contact = profile_data.get("contact", {})
        social_links = profile_data.get("social_links", [])

        # Map social_links to profiles with type validation
        profiles = []
        for link in social_links:
            link_type = link.get("type", "").lower()
            url = link.get("url")

            if not url:
                continue

            # Map to valid ProfileType enum values
            if link_type == "linkedin":
                profiles.append(
                    Profile(type=ProfileType.LINKEDIN, url=url, label="LinkedIn")
                )
            elif link_type == "github":
                profiles.append(
                    Profile(type=ProfileType.GITHUB, url=url, label="GitHub")
                )
            elif link_type == "youtube":
                profiles.append(
                    Profile(type=ProfileType.YOUTUBE, url=url, label="YouTube")
                )
            elif link_type == "twitter":
                profiles.append(
                    Profile(type=ProfileType.TWITTER, url=url, label="Twitter")
                )
            elif link_type == "scholar":
                profiles.append(
                    Profile(type=ProfileType.SCHOLAR, url=url, label="Google Scholar")
                )
            elif link_type in {"website", "personal", "blog", "company"}:
                profiles.append(
                    Profile(type=ProfileType.WEBSITE, url=url, label="Website")
                )
            elif link_type in {"portfolio", "behance", "dribbble"}:
                profiles.append(
                    Profile(type=ProfileType.PORTFOLIO, url=url, label="Portfolio")
                )
            else:
                # All other platforms map to OTHER
                label = link_type.capitalize() if link_type else "Other"
                profiles.append(Profile(type=ProfileType.OTHER, url=url, label=label))

        # Map skills to tags
        tags = profile_data.get("top_skills", [])

        return PersonalInfo(
            full_name=profile_data.get("name"),
            headline=profile_data.get("headline"),
            summary=profile_data.get("summary"),
            email=contact.get("email"),
            phone=contact.get("phone"),
            location=profile_data.get("location"),
            profiles=profiles if profiles else None,
            tags=tags if tags else None,
        )

    def _map_work_experiences(
        self, experiences: List[Dict[str, Any]]
    ) -> List[WorkExperience]:
        """Map experience data to WorkExperience objects."""
        work_experiences = []

        for exp in experiences:
            # Handle both standalone roles and company groups
            if exp.get("type") == "company_group":
                # Company with multiple roles
                company = exp.get("company_name")
                for role in exp.get("roles", []):
                    work_exp = self._create_work_experience(role, company)
                    work_experiences.append(work_exp)
            else:
                # Standalone role (type == "standalone_role")
                work_exp = self._create_work_experience(exp)
                work_experiences.append(work_exp)

        return work_experiences

    def _create_work_experience(
        self, role_data: Dict[str, Any], company_override: Optional[str] = None
    ) -> WorkExperience:
        """Create a WorkExperience object from role data.

        Args:
            role_data: Role data from pdf_parser (either from company_group.roles or standalone_role)
            company_override: Company name from company_group (if applicable)

        Returns:
            WorkExperience object with mapped fields
        """
        # Parse dates - pdf_parser returns start_date and end_date as ISO strings
        start_date = self._parse_date(role_data.get("start_date"))
        end_date = self._parse_date(role_data.get("end_date"))

        # Get highlights - pdf_parser returns this as a string already
        highlights = role_data.get("highlights")

        # Get company name - use override for company_group roles, otherwise from role data
        company_name = company_override or role_data.get("company_name")

        return WorkExperience(
            organization=company_name,
            title=role_data.get("title"),
            location=role_data.get("location"),
            start_date=start_date,
            end_date=end_date,
            is_current=role_data.get("is_current", False),
            highlights=highlights,
            technologies=None,  # pdf_parser doesn't extract technologies from LinkedIn PDFs
            more_context=None,  # Can be populated later if needed
        )

    def _map_education(self, education_list: List[Dict[str, Any]]) -> List[Education]:
        """Map education data to Education objects.

        Args:
            education_list: List of education dictionaries from pdf_parser

        Returns:
            List of Education objects with mapped fields

        Note:
            Handles optional fields gracefully - all fields can be None.
            The pdf_parser returns 'degree' which may contain both degree type
            and field of study (e.g., "Bachelor's degree in Computer Science").
            We map this to the 'degree' field and leave 'branch' as None since
            pdf_parser doesn't separate these fields.
        """
        education_entries = []

        for edu in education_list:
            # Parse dates from ISO format strings
            start_date = self._parse_date(edu.get("start_date"))
            end_date = self._parse_date(edu.get("end_date"))

            # Determine if education is current (no end date or end date is "Present")
            is_current = False
            if edu.get("end_date_text"):
                is_current = edu.get("end_date_text").lower() == "present"
            elif not edu.get("end_date"):
                # If there's a start date but no end date, it might be current
                is_current = bool(edu.get("start_date"))

            education_entries.append(
                Education(
                    institution=edu.get("institution"),
                    degree=edu.get("degree"),
                    branch=None,  # pdf_parser doesn't separate field of study
                    start_date=start_date,
                    end_date=end_date,
                    is_current=is_current,
                    location=None,  # pdf_parser doesn't extract location for education
                    grade=None,  # pdf_parser doesn't extract grades
                )
            )

        return education_entries

    def _map_certifications(self, cert_list: List[str]) -> List[Certification]:
        """Map certifications to Certification objects.

        Args:
            cert_list: List of certification name strings from pdf_parser

        Returns:
            List of Certification objects with name field populated

        Note:
            pdf_parser only extracts certification names from LinkedIn PDFs.
            The issuer and link fields are not available and will be None.
            Empty or whitespace-only certification names are filtered out.
        """
        certifications = []

        for cert in cert_list:
            # Skip empty or whitespace-only certifications
            if cert and cert.strip():
                certifications.append(Certification(name=cert.strip()))

        return certifications

    def _map_text_blobs(self, profile_data: Dict[str, Any]) -> Optional[TextBlobs]:
        """Map honors/awards and languages to text blobs."""
        honors_awards = profile_data.get("honors_awards", [])
        languages = profile_data.get("languages", [])

        achievements = None
        additional_context = None

        # Format honors and awards as achievements
        if honors_awards:
            achievements = "\n".join(f"- {award}" for award in honors_awards)

        # Format languages into additional_context field
        if languages:
            language_lines = []
            for lang in languages:
                language_name = lang.get("language", "")
                proficiency = lang.get("proficiency", "")
                if language_name:
                    if proficiency:
                        language_lines.append(f"{language_name} ({proficiency})")
                    else:
                        language_lines.append(language_name)

            if language_lines:
                additional_context = "Languages: " + ", ".join(language_lines)

        # Only return TextBlobs if we have content
        if achievements or additional_context:
            return TextBlobs(
                achievements=achievements, additional_context=additional_context
            )

        return None

    def _parse_date(self, date_str: Optional[str]) -> Optional[DateInfo]:
        """Parse ISO date string to DateInfo.

        Args:
            date_str: ISO date string from pdf_parser (format: "YYYY-MM-DD")

        Returns:
            DateInfo object with month and year, or None if parsing fails
        """
        if not date_str:
            return None

        try:
            # pdf_parser returns dates in ISO format: "YYYY-MM-DD"
            parts = date_str.split("-")
            year = int(parts[0])
            month = int(parts[1]) if len(parts) > 1 and parts[1] else None

            return DateInfo(month=month, year=year)
        except (ValueError, IndexError):
            return None

    def _merge_github_repos(
        self, portfolio_data: PortfolioData, github_repos: List[GitHubRepo]
    ) -> PortfolioData:
        """Merge GitHub repository data into portfolio.

        Converts GitHub repositories to Project objects and merges them with
        existing LinkedIn projects. GitHub data takes priority as the primary
        source of project information.

        Args:
            portfolio_data: Portfolio data with potential LinkedIn projects
            github_repos: List of GitHub repositories to convert and merge

        Returns:
            Updated PortfolioData with merged GitHub projects

        Note:
            - GitHub repos are converted to Project objects with full metadata
            - Star count is added to more_context field for visibility
            - Language is added to technologies array
            - GitHub projects are appended to existing projects (if any)
        """
        # Convert GitHub repos to Project objects
        github_projects = []
        for repo in github_repos:
            # Build more_context with star count
            more_context = None
            if repo.stars > 0:
                more_context = f"⭐ {repo.stars} stars"

            project = Project(
                name=repo.name,
                highlights=repo.description if repo.description else None,
                technologies=[repo.language] if repo.language else None,
                github=repo.url,
                more_context=more_context,
            )
            github_projects.append(project)

        # Merge with existing projects (GitHub takes priority)
        # LinkedIn PDFs typically don't have detailed project info,
        # so GitHub repos become the primary source of project data
        if portfolio_data.projects:
            # Append GitHub projects to existing ones
            portfolio_data.projects.extend(github_projects)
        else:
            portfolio_data.projects = github_projects

        return portfolio_data


# Global instance
_linkedin_extractor: Optional[LinkedInExtractor] = None


def get_linkedin_extractor() -> LinkedInExtractor:
    """Get the global LinkedInExtractor instance."""
    global _linkedin_extractor
    if _linkedin_extractor is None:
        _linkedin_extractor = LinkedInExtractor()
    return _linkedin_extractor
