"""
Parser for the Certifications section of LinkedIn profiles.

This module extracts certification names from the before_h1 Certifications section.
"""

from typing import List
from .utils import extract_items


def parse_certifications_section(raw_text: str) -> List[str]:
    """
    Parse certifications section into list of certification names.

    Each line (or item separated by double linebreaks) represents a distinct
    certification. Text normalization handles linebreaks that occur due to
    narrow PDF column width.

    Args:
        raw_text: Raw text from the Certifications section

    Returns:
        List of certification names in original order. Returns empty list
        if section is missing or empty.

    Example:
        Input:
            "AWS Certified Solutions\\nArchitect\\n\\nDeep Learning Specialization"
        Output:
            ["AWS Certified Solutions Architect", "Deep Learning Specialization"]
    """
    if not raw_text or not raw_text.strip():
        return []

    # Use extract_items to handle linebreaks and split into distinct certifications
    certifications = extract_items(raw_text)

    return certifications


__all__ = ["parse_certifications_section"]
