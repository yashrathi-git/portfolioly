"""Utilities for extracting structured data from LinkedIn markdown exports.

This module exposes helpers that split a markdown document around the first
level-one heading and summarise sub-sections. The implementation is written with
extensibility in mind so that additional parsing rules can be layered on top
later.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
from typing import Dict, List, Tuple

H1_PATTERN = re.compile(r"^#\s+(?P<title>.+?)\s*$", re.MULTILINE)
H2_PATTERN = re.compile(r"^##\s+(?P<title>.+?)\s*$", re.MULTILINE)
H3_PATTERN = re.compile(r"^###\s+(?P<title>.+?)\s*$", re.MULTILINE)
PAGE_FOOTER_PATTERN = re.compile(r"^Page\s+\d+\s+of\s+\d+\s*$", re.IGNORECASE)


@dataclass
class SectionData:
    """Represents the parsed content within a region of the markdown file."""

    lead_paragraphs: List[str]
    sections: Dict[str, str]


@dataclass
class ExtractionResult:
    """Structured representation of the extracted markdown content."""

    heading: str
    before_h1: SectionData
    after_h1: SectionData

    def to_dict(self) -> Dict[str, Dict[str, str]]:
        """Serialise the extraction for downstream consumption."""

        before_payload: Dict[str, str] = {}
        if self.before_h1.lead_paragraphs:
            intro_text = "\n\n".join(
                paragraph for paragraph in self.before_h1.lead_paragraphs if paragraph
            ).strip()
            if intro_text:
                before_payload["intro"] = intro_text
        before_payload.update(self.before_h1.sections)

        after_payload: Dict[str, str] = {}
        lead_lines = [
            line.strip()
            for paragraph in self.after_h1.lead_paragraphs
            for line in paragraph.splitlines()
            if line.strip()
        ]
        if lead_lines:
            location_line = lead_lines[-1]
            headline_lines = lead_lines[:-1]
            headline_text = "\n".join(headline_lines).strip()
            if headline_text:
                after_payload["headline"] = headline_text
            if location_line:
                after_payload["location"] = location_line
        after_payload.update(self.after_h1.sections)

        return {
            "h1": self.heading,
            "before_h1": before_payload,
            "after_h1": after_payload,
        }


def extract_markdown(path: Path) -> ExtractionResult:
    """Load and extract structured metadata from a markdown file."""

    text = path.read_text(encoding="utf-8")
    return extract_markdown_from_text(text)


def extract_markdown_from_text(text: str) -> ExtractionResult:
    """Extract structured metadata from markdown content provided as a string."""

    heading, leading, trailing = split_on_first_h1(text)
    before = _collect_section_data(leading, heading_pattern=H3_PATTERN)
    after = _collect_section_data(
        _remove_page_markers(trailing),
        heading_pattern=H2_PATTERN,
    )
    return ExtractionResult(heading=heading, before_h1=before, after_h1=after)


def split_on_first_h1(text: str) -> Tuple[str, str, str]:
    """Split the document around the first level-one heading.

    Returns a tuple of ``(heading_text, content_before, content_after)``.
    """

    match = H1_PATTERN.search(text)
    if not match:
        raise ValueError("Markdown does not contain a level-one heading")

    heading_line_start = match.start()
    heading_line_end = text.find("\n", match.end())
    if heading_line_end == -1:
        heading_line_end = len(text)

    heading_text = match.group("title").strip()

    before = text[:heading_line_start]
    after = text[heading_line_end + 1 :] if heading_line_end < len(text) else ""

    return heading_text, before, after


def _collect_section_data(
    content: str, *, heading_pattern: re.Pattern[str]
) -> SectionData:
    lead, sections = _split_content(content, heading_pattern=heading_pattern)
    return SectionData(lead_paragraphs=lead, sections=sections)


def _split_content(
    content: str, *, heading_pattern: re.Pattern[str]
) -> Tuple[List[str], Dict[str, str]]:
    matches = list(heading_pattern.finditer(content))
    if not matches:
        return _extract_paragraphs(content), {}

    lead_end = matches[0].start()
    lead_content = content[:lead_end]
    sections: Dict[str, str] = {}

    for idx, match in enumerate(matches):
        section_start = match.end()
        section_end = (
            matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        )
        raw_block = content[section_start:section_end]
        title = match.group("title").strip()
        sections[title] = _normalise_block(raw_block)

    return _extract_paragraphs(lead_content), sections


def _extract_paragraphs(content: str) -> List[str]:
    cleaned = _remove_page_markers(content)
    paragraphs = [
        block.strip() for block in re.split(r"\n\s*\n+", cleaned) if block.strip()
    ]
    return [_normalise_spacing(paragraph) for paragraph in paragraphs]


def _normalise_block(text: str) -> str:
    lines = [line.rstrip() for line in text.splitlines()]
    filtered = [line for line in lines if not PAGE_FOOTER_PATTERN.match(line.strip())]
    normalised = "\n".join(filtered).strip()
    return _normalise_spacing(normalised)


def _normalise_spacing(text: str) -> str:
    if not text:
        return ""
    normalised_lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(normalised_lines).strip()


def _remove_page_markers(content: str) -> str:
    lines = content.splitlines()
    filtered = [line for line in lines if not PAGE_FOOTER_PATTERN.match(line.strip())]
    return "\n".join(filtered)


__all__ = [
    "ExtractionResult",
    "SectionData",
    "extract_markdown",
    "extract_markdown_from_text",
    "split_on_first_h1",
]
