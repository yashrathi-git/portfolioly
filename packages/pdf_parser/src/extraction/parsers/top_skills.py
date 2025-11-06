"""
Parser for the Top Skills section of LinkedIn profiles.

This module extracts skill names from the before_h1 Top Skills section.
"""

from typing import List
from .utils import extract_items


def parse_top_skills_section(raw_text: str) -> List[str]:
    """
    Parse top skills section into list of skill names.

    Each line (or item separated by double linebreaks) represents a distinct
    skill. Text normalization handles linebreaks that occur due to narrow
    PDF column width.

    Args:
        raw_text: Raw text from the Top Skills section

    Returns:
        List of skill names in original order. Returns empty list
        if section is missing or empty.

    Example:
        Input:
            "Python\\n\\nMachine Learning\\n\\nFastAPI"
        Output:
            ["Python", "Machine Learning", "FastAPI"]
    """
    if not raw_text or not raw_text.strip():
        return []

    # Use extract_items to handle linebreaks and split into distinct skills
    skills = extract_items(raw_text)

    return skills


__all__ = ["parse_top_skills_section"]
