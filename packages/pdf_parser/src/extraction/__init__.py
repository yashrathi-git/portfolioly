"""Extraction helpers for parsing LinkedIn markdown artifacts."""

from .api import parse_profile, parse_profile_from_pdf, safe_parse
from .markdown_converter import convert_pdf_to_markdown
from .markdown_extractor import (
    ExtractionResult,
    SectionData,
    extract_markdown,
    extract_markdown_from_text,
    split_on_first_h1,
)
from .parsers.certifications import parse_certifications_section
from .parsers.contact import parse_contact_section
from .parsers.education import parse_education_section
from .parsers.experience import parse_experience_section
from .parsers.honors_awards import parse_honors_awards_section
from .parsers.languages import parse_languages_section
from .parsers.top_skills import parse_top_skills_section

__all__ = [
    # Unified API
    "parse_profile",
    "parse_profile_from_pdf",
    "safe_parse",
    # PDF conversion
    "convert_pdf_to_markdown",
    # Base extraction
    "ExtractionResult",
    "SectionData",
    "extract_markdown",
    "extract_markdown_from_text",
    "split_on_first_h1",
    # Section parsers
    "parse_certifications_section",
    "parse_contact_section",
    "parse_education_section",
    "parse_experience_section",
    "parse_honors_awards_section",
    "parse_languages_section",
    "parse_top_skills_section",
]
