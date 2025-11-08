"""
LinkedIn data formatter for AI processing.

This service pre-processes LinkedIn PDF markdown to extract structured data
and format it in a way that makes AI extraction more accurate and reliable.
The LLM will handle cleaning company names and other data based on prompt instructions.
"""

import sys
import logging
from pathlib import Path
from typing import Optional, Dict, Any

# Add pdf_parser package to Python path
PDF_PARSER_PATH = (
    Path(__file__).parent.parent.parent.parent / "packages" / "pdf_parser" / "src"
)
sys.path.insert(0, str(PDF_PARSER_PATH))

logger = logging.getLogger(__name__)


def format_linkedin_for_ai(linkedin_markdown: str) -> str:
    """
    Parse and format LinkedIn markdown data for better AI extraction.

    This function:
    1. Parses the LinkedIn PDF using the pdf_parser package
    2. Extracts structured data
    3. Formats it in a clear, organized way for AI processing
    4. Falls back to raw markdown if parsing fails

    Args:
        linkedin_markdown: Raw markdown from LinkedIn PDF

    Returns:
        Formatted string optimized for AI extraction
    """
    try:
        from extraction.api import parse_profile

        # Parse LinkedIn profile
        profile_data = parse_profile(linkedin_markdown)

        # Format structured data
        formatted_sections = []

        # Header
        formatted_sections.append("=== LINKEDIN PROFILE ===\n")

        # Personal Information
        if profile_data.get("name"):
            formatted_sections.append(f"**Name:** {profile_data['name']}")

        if profile_data.get("headline"):
            formatted_sections.append(f"**Headline:** {profile_data['headline']}")

        if profile_data.get("location"):
            formatted_sections.append(f"**Location:** {profile_data['location']}")

        if profile_data.get("summary"):
            formatted_sections.append(f"\n**Summary:**\n{profile_data['summary']}")

        # Contact Information
        contact = profile_data.get("contact", {})
        if contact.get("email") or contact.get("phone"):
            formatted_sections.append("\n**Contact:**")
            if contact.get("email"):
                formatted_sections.append(f"- Email: {contact['email']}")
            if contact.get("phone"):
                formatted_sections.append(f"- Phone: {contact['phone']}")

        # Social Links
        social_links = profile_data.get("social_links", [])
        if social_links:
            formatted_sections.append("\n**Professional Links:**")
            for link in social_links:
                link_type = link.get("type", "Other").capitalize()
                url = link.get("url")
                if url:
                    formatted_sections.append(f"- {link_type}: {url}")

        # Work Experience
        experiences = profile_data.get("experience", [])
        if experiences:
            formatted_sections.append("\n**Work Experience:**\n")
            for exp in experiences:
                if exp.get("type") == "company_group":
                    # Multiple roles at same company
                    company = exp.get("company_name")
                    formatted_sections.append(f"### {company}")
                    for role in exp.get("roles", []):
                        formatted_sections.append(_format_role(role, skip_company=True))
                else:
                    # Standalone role
                    formatted_sections.append(_format_role(exp))
                formatted_sections.append("")  # Empty line between experiences

        # Education
        education = profile_data.get("education", [])
        if education:
            formatted_sections.append("\n**Education:**\n")
            for edu in education:
                institution = edu.get("institution", "Unknown Institution")
                degree = edu.get("degree", "")
                dates = _format_date_range(
                    edu.get("start_date"), edu.get("end_date"), edu.get("end_date_text")
                )

                formatted_sections.append(f"### {institution}")
                if degree:
                    formatted_sections.append(f"- Degree: {degree}")
                if dates:
                    formatted_sections.append(f"- Duration: {dates}")
                formatted_sections.append("")

        # Skills
        skills = profile_data.get("top_skills", [])
        if skills:
            formatted_sections.append("\n**Top Skills:**")
            formatted_sections.append(", ".join(skills))

        # Certifications
        certifications = profile_data.get("certifications", [])
        if certifications:
            formatted_sections.append("\n**Certifications:**")
            for cert in certifications:
                if cert and cert.strip():
                    formatted_sections.append(f"- {cert}")

        # Honors & Awards
        honors = profile_data.get("honors_awards", [])
        if honors:
            formatted_sections.append("\n**Honors & Awards:**")
            for honor in honors:
                formatted_sections.append(f"- {honor}")

        # Languages
        languages = profile_data.get("languages", [])
        if languages:
            formatted_sections.append("\n**Languages:**")
            for lang in languages:
                lang_name = lang.get("language", "")
                proficiency = lang.get("proficiency", "")
                if lang_name:
                    if proficiency:
                        formatted_sections.append(f"- {lang_name} ({proficiency})")
                    else:
                        formatted_sections.append(f"- {lang_name}")

        result = "\n".join(formatted_sections)
        logger.info("Successfully formatted LinkedIn data for AI processing")
        return result

    except Exception as e:
        # If parsing fails, return raw markdown
        logger.warning(f"Failed to parse LinkedIn data, using raw markdown: {str(e)}")
        return linkedin_markdown


def _format_role(role_data: Dict[str, Any], skip_company: bool = False) -> str:
    """
    Format a work experience role into a structured string.

    Args:
        role_data: Role data dictionary
        skip_company: If True, don't include company name (used for company groups)

    Returns:
        Formatted role string
    """
    lines = []

    # Title and Company
    title = role_data.get("title", "Unknown Title")
    if not skip_company:
        company = role_data.get("company_name")
        if company:
            lines.append(f"### {title} at {company}")
        else:
            lines.append(f"### {title}")
    else:
        lines.append(f"**{title}**")

    # Location
    location = role_data.get("location")
    if location:
        lines.append(f"- Location: {location}")

    # Duration
    dates = _format_date_range(
        role_data.get("start_date"),
        role_data.get("end_date"),
        current=role_data.get("is_current", False),
    )
    if dates:
        lines.append(f"- Duration: {dates}")

    # Highlights/Description
    highlights = role_data.get("highlights")
    if highlights:
        lines.append(f"- Responsibilities/Achievements:\n{highlights}")

    return "\n".join(lines)


def _format_date_range(
    start_date: Optional[str],
    end_date: Optional[str],
    end_date_text: Optional[str] = None,
    current: bool = False,
) -> Optional[str]:
    """
    Format date range for display.

    Args:
        start_date: Start date in ISO format (YYYY-MM-DD)
        end_date: End date in ISO format (YYYY-MM-DD)
        end_date_text: Original end date text (e.g., "Present")
        current: Whether this is a current position

    Returns:
        Formatted date range string or None
    """
    if not start_date:
        return None

    start = _format_date(start_date)

    if current or (end_date_text and end_date_text.lower() == "present"):
        return f"{start} - Present"
    elif end_date:
        end = _format_date(end_date)
        return f"{start} - {end}"
    else:
        return start


def _format_date(date_str: str) -> str:
    """
    Format ISO date to readable format.

    Args:
        date_str: Date in ISO format (YYYY-MM-DD)

    Returns:
        Formatted date string (e.g., "Jan 2020" or "2020")
    """
    try:
        parts = date_str.split("-")
        year = parts[0]
        if len(parts) > 1 and parts[1] and parts[1] != "00":
            month_num = int(parts[1])
            months = [
                "",
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ]
            if 1 <= month_num <= 12:
                return f"{months[month_num]} {year}"
        return year
    except (ValueError, IndexError):
        return date_str
