"""
Shared utilities for parsing LinkedIn PDF exports.

This module provides text normalization helpers for both before_h1 sections
and general-purpose reflow of prose/bullet text where PDFs insert hard wraps.
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


def collapse_to_paragraph(text: str) -> str:
    """
    Convert arbitrary wrapped text into a single paragraph.

    All line breaks are replaced with spaces while preserving word separation.
    """
    if not text:
        return ""

    tokens = [
        line.strip() for line in text.replace("\r", "").split("\n") if line.strip()
    ]
    return " ".join(tokens)


def normalise_bulleted_block(text: str) -> str:
    """
    Normalise text that may contain simple bullet lists.

    Lines beginning with '-', '*', or common bullet symbols start a new bullet item.
    Continuation lines are joined into the current bullet. Non-bullet text is
    collapsed into plain paragraphs. Bullets and paragraphs are returned on
    separate lines.
    """
    if not text:
        return ""

    bullet_markers = {"-", "*", "•", "‣", "∙", "◦"}
    lines = text.replace("\r", "").split("\n")

    result: List[str] = []
    current_paragraph: List[str] = []
    current_bullet: List[str] = []
    current_marker: str | None = None

    def flush_paragraph() -> None:
        nonlocal current_paragraph
        if current_paragraph:
            result.append(" ".join(item.strip() for item in current_paragraph).strip())
            current_paragraph = []

    def flush_bullet() -> None:
        nonlocal current_bullet, current_marker
        if current_marker is not None and current_bullet:
            content = " ".join(
                segment.strip() for segment in current_bullet if segment.strip()
            )
            result.append(f"{current_marker} {content}".strip())
        current_bullet = []
        current_marker = None

    for raw_line in lines:
        stripped = raw_line.strip()

        if not stripped:
            if current_marker is not None:
                # Allow blank lines within a bullet item (PDF artifacts)
                continue
            flush_bullet()
            flush_paragraph()
            continue

        first_char = stripped[0]
        if first_char in bullet_markers and (len(stripped) == 1 or stripped[1] == " "):
            flush_bullet()
            flush_paragraph()
            current_marker = first_char
            content = stripped[1:].strip() if len(stripped) > 1 else ""
            current_bullet = [content] if content else []
            continue

        if current_marker is not None:
            current_bullet.append(stripped)
        else:
            current_paragraph.append(stripped)

    flush_bullet()
    flush_paragraph()

    return "\n".join(filter(None, result))


__all__ = [
    "normalize_before_h1_text",
    "extract_items",
    "join_single_linebreaks",
    "collapse_to_paragraph",
    "normalise_bulleted_block",
]
