"""
Shared utilities for parsing before_h1 sections.

This module provides text normalization functions that handle linebreaks
in LinkedIn PDF exports. The key pattern is:
- Double linebreak (\\n\\n): separates distinct items
- Single linebreak (\\n): indicates text continuation from narrow PDF column
"""

from typing import List


def normalize_before_h1_text(text: str) -> str:
    """
    Normalize text from before_h1 sections by joining fragmented lines.

    The deterministic strategy:
    - Split text on double linebreaks (\\n\\n) to identify distinct items
    - Within each item, join lines separated by single linebreaks
    - Preserve the double linebreak structure for item separation
    - Remove extra whitespace when joining single-linebreak fragments

    Args:
        text: Raw text from a before_h1 section

    Returns:
        Normalized text with single linebreaks joined, double linebreaks preserved

    Example:
        Input:
            "Item 1 line 1\\nItem 1 line 2\\n\\nItem 2 line 1\\nItem 2 line 2"
        Output:
            "Item 1 line 1 Item 1 line 2\\n\\nItem 2 line 1 Item 2 line 2"
    """
    if not text:
        return text

    # Extract items (split on double linebreaks)
    items = extract_items(text)

    # Join items back with double linebreaks
    return "\n\n".join(items)


def extract_items(text: str) -> List[str]:
    """
    Split text into logical items based on double linebreaks.

    Each item may contain text that was split across multiple lines due to
    narrow PDF column width. This function joins those fragments within each item.

    Args:
        text: Raw text with potential linebreak artifacts

    Returns:
        List of items with single-linebreak fragments joined

    Example:
        Input: "URL part 1\\nURL part 2\\n\\nSkill 1\\nSkill 2"
        Output: ["URL part 1 URL part 2", "Skill 1 Skill 2"]
    """
    if not text:
        return []

    # Split on double linebreaks to get distinct items
    raw_items = text.split("\n\n")

    # Join single linebreaks within each item
    normalized_items = []
    for item in raw_items:
        normalized = join_single_linebreaks(item)
        if normalized:  # Only include non-empty items
            normalized_items.append(normalized)

    return normalized_items


def join_single_linebreaks(text: str) -> str:
    """
    Join text fragments separated by single linebreaks.

    Handles URLs, markdown links, and regular text. Single linebreaks are
    replaced with spaces to join fragments that were split due to narrow
    PDF column width.

    Args:
        text: Text fragment that may contain single linebreaks

    Returns:
        Text with single linebreaks replaced by spaces, trimmed

    Example:
        Input: "https://example.com/\\npath/to/page"
        Output: "https://example.com/ path/to/page"

        Input: "[Link text](https://\\nexample.com)"
        Output: "[Link text](https:// example.com)"
    """
    if not text:
        return ""

    # Replace single linebreaks with spaces
    joined = text.replace("\n", " ")

    # Clean up multiple consecutive spaces
    while "  " in joined:
        joined = joined.replace("  ", " ")

    # Trim whitespace
    return joined.strip()


__all__ = [
    "normalize_before_h1_text",
    "extract_items",
    "join_single_linebreaks",
]
