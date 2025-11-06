"""
Languages section parser for LinkedIn profiles.

This module extracts language names and proficiency levels from the
Languages section of LinkedIn profiles.
"""

import re
from typing import List, Dict, Optional
from .utils import normalize_before_h1_text


def parse_languages_section(raw_text: str) -> List[Dict[str, Optional[str]]]:
    """
    Parse languages section into structured list.

    Extracts language names and optional proficiency levels from the Languages
    section. Proficiency levels are typically enclosed in parentheses.

    Args:
        raw_text: Raw text from the Languages section

    Returns:
        List of dictionaries with language and proficiency_level:
        [
            {"language": "English", "proficiency_level": "Native or Bilingual"},
            {"language": "Spanish", "proficiency_level": "Professional Working"},
            {"language": "French", "proficiency_level": None}
        ]

    Example:
        Input:
            '''
            Hindi (Native or Bilingual)
            English (Full Professional)
            German
            '''
        Output:
            [
                {"language": "Hindi", "proficiency_level": "Native or Bilingual"},
                {"language": "English", "proficiency_level": "Full Professional"},
                {"language": "German", "proficiency_level": None}
            ]
    """
    if not raw_text or not raw_text.strip():
        return []

    # Normalize text to handle linebreaks
    normalized_text = normalize_before_h1_text(raw_text)

    # Split into lines
    lines = normalized_text.split("\n\n")

    languages = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Try to extract language with proficiency level in parentheses
        # Pattern: "Language Name (Proficiency Level)"
        match = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", line)

        if match:
            # Language with proficiency level
            language_name = match.group(1).strip()
            proficiency_level = match.group(2).strip()
            languages.append(
                {"language": language_name, "proficiency_level": proficiency_level}
            )
        else:
            # Language without proficiency level
            languages.append({"language": line, "proficiency_level": None})

    return languages


__all__ = ["parse_languages_section"]
