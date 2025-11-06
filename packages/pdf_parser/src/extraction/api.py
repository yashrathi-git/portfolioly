"""Unified API for parsing complete LinkedIn profiles.

This module provides a single entry point for parsing all sections of a
LinkedIn profile from markdown text. It orchestrates the base extraction
and all section-specific parsers with comprehensive error handling.
"""

from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union

from .markdown_extractor import extract_markdown_from_text, ExtractionResult
from .markdown_converter import convert_pdf_to_markdown
from .parsers.contact import parse_contact_section
from .parsers.top_skills import parse_top_skills_section
from .parsers.languages import parse_languages_section
from .parsers.certifications import parse_certifications_section
from .parsers.honors_awards import parse_honors_awards_section
from .parsers.experience import parse_experience_section
from .parsers.education import parse_education_section


T = TypeVar("T")


def safe_parse(parser_func: Callable[[str], T], text: Optional[str], default: T) -> T:
    """
    Safely execute parser function with error handling.

    Wraps parser function calls in try-except to prevent individual parser
    failures from breaking the entire parsing operation. Returns default
    value if parsing fails or input is empty.

    Args:
        parser_func: Parser function to execute
        text: Input text to parse (may be None or empty)
        default: Default value to return on failure

    Returns:
        Parsed result on success, default value on failure or empty input
    """
    if not text or not text.strip():
        return default

    try:
        return parser_func(text)
    except Exception:
        # Silently return default on error to allow other sections to parse
        return default


def parse_profile(markdown_text: str) -> Dict[str, Any]:
    """
    Parse complete LinkedIn profile from markdown text.

    This function orchestrates the complete parsing workflow by calling the
    base markdown extractor and all section-specific parsers. Each parser
    is wrapped in error handling to ensure partial failures don't break the
    entire operation.

    Args:
        markdown_text: Raw markdown content from LinkedIn PDF export

    Returns:
        Dictionary with complete profile structure:
        {
            "name": str,
            "headline": Optional[str],
            "location": Optional[str],
            "contact": Dict[str, str],
            "top_skills": List[str],
            "languages": List[Dict[str, Optional[str]]],
            "certifications": List[str],
            "honors_awards": List[str],
            "experience": List[Dict],
            "education": List[Dict],
            "summary": Optional[str],
            "raw_sections": {
                "before_h1": Dict[str, str],
                "after_h1": Dict[str, str]
            }
        }

    Example:
        >>> markdown = Path("profile.md").read_text()
        >>> profile = parse_profile(markdown)
        >>> print(profile["name"])
        >>> print(profile["contact"]["email"])
        >>> for exp in profile["experience"]:
        ...     print(exp["title"])
    """
    # Step 1: Extract base markdown structure
    extraction: ExtractionResult = extract_markdown_from_text(markdown_text)

    # Step 2: Extract name from h1 heading
    name = extraction.heading

    # Step 3: Extract headline and location from after_h1 lead paragraphs
    headline: Optional[str] = None
    location: Optional[str] = None

    # The base extractor already processes lead paragraphs into headline and location
    # in the to_dict() method, so we can extract them from there
    extraction_dict = extraction.to_dict()
    after_h1_dict = extraction_dict.get("after_h1", {})
    headline = after_h1_dict.get("headline")
    location = after_h1_dict.get("location")

    # Step 4: Parse before_h1 sections with error handling
    before_h1_sections = extraction.before_h1.sections

    contact = safe_parse(parse_contact_section, before_h1_sections.get("Contact"), {})

    top_skills = safe_parse(
        parse_top_skills_section, before_h1_sections.get("Top Skills"), []
    )

    languages = safe_parse(
        parse_languages_section, before_h1_sections.get("Languages"), []
    )

    certifications = safe_parse(
        parse_certifications_section, before_h1_sections.get("Certifications"), []
    )

    honors_awards = safe_parse(
        parse_honors_awards_section, before_h1_sections.get("Honors-Awards"), []
    )

    # Step 5: Parse after_h1 sections with error handling
    after_h1_sections = extraction.after_h1.sections

    experience = safe_parse(
        parse_experience_section, after_h1_sections.get("Experience"), []
    )

    education = safe_parse(
        parse_education_section, after_h1_sections.get("Education"), []
    )

    # Extract summary directly (no parsing needed)
    summary = after_h1_sections.get("Summary")

    # Step 6: Build complete profile dictionary
    profile: Dict[str, Any] = {
        "name": name,
        "headline": headline,
        "location": location,
        "contact": contact,
        "top_skills": top_skills,
        "languages": languages,
        "certifications": certifications,
        "honors_awards": honors_awards,
        "experience": experience,
        "education": education,
        "summary": summary,
        "raw_sections": {
            "before_h1": before_h1_sections,
            "after_h1": after_h1_sections,
        },
    }

    return profile


def parse_profile_from_pdf(pdf_source: Union[Path, bytes, str]) -> Dict[str, Any]:
    """
    Parse LinkedIn profile directly from PDF.

    This function provides a convenient way to parse LinkedIn profiles directly
    from PDF files without manually converting to markdown first. It handles
    the conversion internally and then uses the standard parsing pipeline.

    Args:
        pdf_source: Either a Path object, string path to PDF file, or PDF bytes

    Returns:
        Dictionary with complete profile structure (same as parse_profile)

    Raises:
        ValueError: If PDF conversion or parsing fails
        ImportError: If pymupdf4llm is not installed

    Example:
        >>> # From file path
        >>> profile = parse_profile_from_pdf(Path("linkedin.pdf"))
        >>> print(profile["name"])
        >>>
        >>> # From bytes (e.g., from web upload)
        >>> profile = parse_profile_from_pdf(pdf_bytes)
        >>> print(profile["contact"]["email"])
    """
    # Step 1: Convert PDF to markdown
    try:
        markdown_text = convert_pdf_to_markdown(pdf_source)
    except (ValueError, ImportError) as e:
        # Re-raise with additional context
        raise ValueError(f"PDF conversion failed: {str(e)}") from e

    # Step 2: Parse markdown using existing function
    try:
        profile = parse_profile(markdown_text)
    except Exception as e:
        raise ValueError(f"Failed to parse LinkedIn profile from PDF: {str(e)}") from e

    return profile


__all__ = ["parse_profile", "parse_profile_from_pdf", "safe_parse"]
