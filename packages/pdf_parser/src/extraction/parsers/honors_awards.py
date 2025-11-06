"""
Parser for the Honors-Awards section of LinkedIn profiles.

This module extracts award names from the before_h1 Honors-Awards section.
"""

from typing import List
from .utils import extract_items


def parse_honors_awards_section(raw_text: str) -> List[str]:
    """
    Parse honors-awards section into list of award names.

    Each line (or item separated by double linebreaks) represents a distinct
    honor or award. Text normalization handles linebreaks that occur due to
    narrow PDF column width.

    Args:
        raw_text: Raw text from the Honors-Awards section

    Returns:
        List of award names in original order. Returns empty list
        if section is missing or empty.

    Example:
        Input:
            "Winner @ VIT Internal\\nStudent Hackathon\\n\\nBest Paper Award at ICB 2018"
        Output:
            ["Winner @ VIT Internal Student Hackathon", "Best Paper Award at ICB 2018"]
    """
    if not raw_text or not raw_text.strip():
        return []

    # Use extract_items to handle linebreaks and split into distinct awards
    awards = extract_items(raw_text)

    return awards


__all__ = ["parse_honors_awards_section"]
