"""Parser for LinkedIn education sections.

The parsing strategy follows a duration-first approach when duration patterns
are present, and applies heuristics when they are absent. Education entries
consist of an institution name (mandatory), degree name (optional), and
duration (optional). The parser handles inline formats where degree and
duration appear on the same line, as well as multi-line formats.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

from .experience import PAGE_FOOTER_RE, MONTH_MAP

# Set up logger for this module
logger = logging.getLogger(__name__)


# --- Regular expressions -----------------------------------------------------

# Duration pattern: matches "(YYYY - YYYY)" or "(Month YYYY - Month YYYY)"
# Handles both "September 2022" and "September2022" (with or without space)
DURATION_RE = re.compile(
    r"(?ix)\(\s*"
    r"(?P<start>(?:[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Present|present|[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*\)"
)

# Inline degree with duration: matches "Degree Name · (YYYY - YYYY)"
# Handles both "September 2022" and "September2022" (with or without space)
INLINE_DEGREE_DURATION_RE = re.compile(
    r"(?ix)^(?P<degree>.+?)\s*[·•]\s*\(\s*"
    r"(?P<start>(?:[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Present|present|[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*\)\s*$"
)

# Degree indicators for heuristic boundary detection
DEGREE_INDICATORS = [
    "bachelor",
    "master",
    "phd",
    "ph.d",
    "doctorate",
    "diploma",
    "certificate",
    "associate",
    "degree",
    "b.s.",
    "b.a.",
    "m.s.",
    "m.a.",
    "m.b.a.",
    "b.tech",
    "m.tech",
    "b.e.",
    "m.e.",
]


# --- Data containers ---------------------------------------------------------


@dataclass
class EducationEntry:
    """Represents a single education credential."""

    institution: str
    degree: Optional[str] = None
    start_text: Optional[str] = None
    start_iso: Optional[str] = None
    end_text: Optional[str] = None
    end_iso: Optional[str] = None
    duration_months: Optional[int] = None
    incomplete: bool = False

    def as_dict(self) -> Dict[str, object]:
        """Convert to dictionary for JSON serialization.

        Returns:
            Dictionary with non-null fields only. The incomplete field is
            included only when True to keep output clean.
        """
        payload: Dict[str, Optional[object]] = {
            "institution": self.institution,
            "degree": self.degree,
            "start_date_text": self.start_text,
            "start_date": self.start_iso,
            "end_date_text": self.end_text,
            "end_date": self.end_iso,
            "duration_months": self.duration_months,
            "incomplete": self.incomplete if self.incomplete else None,
        }
        return {k: v for k, v in payload.items() if v is not None}


# --- Normalisation utilities -------------------------------------------------


def _normalise_lines(text: str) -> List[str]:
    """Normalize line endings and remove page footers.

    Args:
        text: Raw markdown text from education section

    Returns:
        List of normalized lines with page footers removed and consecutive
        blank lines collapsed to single blank lines
    """
    normalised = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in normalised.split("\n")]
    filtered = [line for line in lines if not PAGE_FOOTER_RE.match(line.strip())]

    collapsed: List[str] = []
    prev_blank = False
    for line in filtered:
        if line.strip() == "":
            if not prev_blank:
                collapsed.append("")
            prev_blank = True
        else:
            collapsed.append(line)
            prev_blank = False
    return collapsed


def _next_non_empty(lines: Sequence[str], start: int) -> Optional[int]:
    """Find the next non-blank line starting from a given index.

    Args:
        lines: Sequence of text lines
        start: Starting index (inclusive)

    Returns:
        Index of the next non-empty line, or None if not found
    """
    for idx in range(start, len(lines)):
        if lines[idx].strip():
            return idx
    return None


def _previous_non_empty(lines: Sequence[str], start: int) -> Optional[int]:
    """Find the previous non-blank line starting from a given index.

    Args:
        lines: Sequence of text lines
        start: Starting index (inclusive)

    Returns:
        Index of the previous non-empty line, or None if not found
    """
    for idx in range(start, -1, -1):
        if lines[idx].strip():
            return idx
    return None


# --- Date parsing utilities --------------------------------------------------


def _parse_date_to_iso(value: Optional[str]) -> Tuple[Optional[str], str]:
    """Convert date text to ISO format.

    Args:
        value: Date string in formats like "2022", "March 2022", "March2022", or "Present"

    Returns:
        Tuple of (iso_date, precision) where:
        - iso_date is in YYYY-MM-DD format or None
        - precision is "year", "month", "present", or "unknown"
    """
    if not value:
        return None, "unknown"
    raw = value.strip()
    if re.match(r"(?i)^present$", raw):
        return None, "present"
    # Match "March 2022" or "March2022" (with or without space)
    match = re.match(r"(?ix)^(?P<mon>[A-Za-z]{3,})\.?\s*(?P<yr>\d{4})$", raw)
    if match:
        month_token = match.group("mon").lower().rstrip(".")
        month_code = MONTH_MAP.get(month_token[:3], MONTH_MAP.get(month_token))
        if month_code:
            return f"{match.group('yr')}-{month_code}-01", "month"
        return f"{match.group('yr')}-01-01", "year"
    numeric_match = re.match(r"^\s*(\d{4})\s*$", raw)
    if numeric_match:
        return f"{numeric_match.group(1)}-01-01", "year"

    # Unrecognized date format
    logger.warning(f"Unrecognized date format: '{raw}'")
    return None, "unknown"


def _months_between(start_iso: Optional[str], end_iso: Optional[str]) -> Optional[int]:
    """Calculate months between two ISO dates.

    Args:
        start_iso: Start date in YYYY-MM-DD format
        end_iso: End date in YYYY-MM-DD format

    Returns:
        Number of months between dates (inclusive), or None if calculation fails
    """
    if not start_iso or not end_iso:
        return None
    try:
        start_year, start_month, _ = start_iso.split("-", 2)
        end_year, end_month, _ = end_iso.split("-", 2)
        months = (
            (int(end_year) - int(start_year)) * 12
            + (int(end_month) - int(start_month))
            + 1
        )
        return months if months >= 0 else None
    except Exception:
        return None


# --- Duration detection ------------------------------------------------------


def _find_duration_lines(lines: Sequence[str]) -> Dict[int, Dict[str, str]]:
    """Scan all lines and identify those containing duration patterns.

    This function detects both standalone duration patterns like "(2022 - 2026)"
    and inline formats like "Bachelor's degree · (2022 - 2026)". It also handles
    multi-line duration patterns where the opening parenthesis is on one line
    and the rest continues on the next line.

    Args:
        lines: Sequence of text lines to scan

    Returns:
        Dictionary mapping line index to dict with keys:
        - "start": Start date text (e.g. "2022" or "March 2022")
        - "end": End date text (e.g. "2026" or "Present")
        - "multiline": True if duration spans multiple lines
        - "end_line": Index of the line where duration ends (for multiline)
    """
    duration_lines: Dict[int, Dict[str, str]] = {}

    idx = 0
    while idx < len(lines):
        line = lines[idx]

        # Check for duration pattern on single line
        match = DURATION_RE.search(line)
        if match:
            duration_lines[idx] = {
                "start": match.group("start"),
                "end": match.group("end"),
            }
            idx += 1
            continue

        # Check for incomplete duration pattern (opening paren but no closing)
        # Pattern: text ending with "· (" or just "(" followed by potential date start
        if "(" in line and ")" not in line:
            # Look ahead to next non-empty line to see if it completes the duration
            next_idx = _next_non_empty(lines, idx + 1)
            if next_idx is not None:
                # Join the two lines and check for duration pattern
                joined = line + " " + lines[next_idx]
                match = DURATION_RE.search(joined)
                if match:
                    duration_lines[idx] = {
                        "start": match.group("start"),
                        "end": match.group("end"),
                        "multiline": True,
                        "end_line": next_idx,
                    }

        idx += 1

    return duration_lines


# --- Entry parsing -----------------------------------------------------------


def _parse_entry_with_duration(
    lines: Sequence[str],
    duration_idx: int,
    duration_data: Dict[str, str],
) -> Optional[EducationEntry]:
    """Parse an education entry when a duration pattern is detected.

    This function implements deterministic parsing by using the duration line
    as an anchor point. It searches backward to find the institution name and
    extracts degree text from lines between the institution and duration.

    Args:
        lines: Sequence of all text lines
        duration_idx: Index of the line containing the duration pattern
        duration_data: Dictionary with "start" and "end" date text, and optionally
                      "multiline" and "end_line" for multi-line durations

    Returns:
        EducationEntry with incomplete=False, or None if parsing fails
    """
    duration_line = lines[duration_idx]
    is_multiline = duration_data.get("multiline", False)
    duration_end_idx = duration_data.get("end_line", duration_idx)

    # For multiline durations, join the lines for pattern matching
    if is_multiline:
        duration_line = lines[duration_idx] + " " + lines[duration_end_idx]

    # Check if this is an inline format: "Degree · (YYYY - YYYY)"
    inline_match = INLINE_DEGREE_DURATION_RE.match(duration_line)
    if inline_match:
        # Inline format: degree and duration on same line
        degree_text = inline_match.group("degree").strip()

        # Search backward for institution (first non-empty line before this one)
        institution_idx = _previous_non_empty(lines, duration_idx - 1)
        if institution_idx is None:
            return None

        institution = lines[institution_idx].strip()

        # Parse dates
        start_iso, start_precision = _parse_date_to_iso(duration_data["start"])
        end_iso, end_precision = _parse_date_to_iso(duration_data["end"])
        duration_months = _months_between(start_iso, end_iso)

        return EducationEntry(
            institution=institution,
            degree=degree_text,
            start_text=duration_data["start"],
            start_iso=start_iso,
            end_text=duration_data["end"],
            end_iso=end_iso,
            duration_months=duration_months,
            incomplete=False,
        )

    # Multi-line format: institution, degree(s), then duration on separate lines
    # Search backward from duration line to find institution
    institution_idx = None
    degree_start_idx = None

    # Find the first non-empty line before the duration line
    # This could be part of the degree or the institution itself
    # For multiline durations, we need to skip back past the continuation line
    search_start = duration_idx - 1
    current_idx = _previous_non_empty(lines, search_start)

    if current_idx is None:
        return None

    # Keep searching backward to find where this entry starts
    # The institution is the first line of the entry
    # We need to find the boundary by looking for:
    # 1. A blank line before the current position
    # 2. Another duration line (indicating previous entry)
    # 3. Beginning of the document

    entry_start_idx = current_idx
    search_idx = current_idx - 1

    while search_idx >= 0:
        line = lines[search_idx]

        # If we hit a blank line, the entry starts after it
        if not line.strip():
            entry_start_idx = _next_non_empty(lines, search_idx + 1)
            break

        # If we hit another duration line, the entry starts after it
        if DURATION_RE.search(line):
            entry_start_idx = _next_non_empty(lines, search_idx + 1)
            break

        # Otherwise, this line is part of the current entry
        entry_start_idx = search_idx
        search_idx -= 1

    # The institution is the first line of the entry
    institution_idx = entry_start_idx
    institution = lines[institution_idx].strip()

    # Degree text is everything between institution and duration
    degree_lines = []
    for idx in range(institution_idx + 1, duration_idx):
        line = lines[idx].strip()
        if line:
            degree_lines.append(line)

    degree_text = " ".join(degree_lines) if degree_lines else None

    # Parse dates
    start_iso, start_precision = _parse_date_to_iso(duration_data["start"])
    end_iso, end_precision = _parse_date_to_iso(duration_data["end"])
    duration_months = _months_between(start_iso, end_iso)

    return EducationEntry(
        institution=institution,
        degree=degree_text,
        start_text=duration_data["start"],
        start_iso=start_iso,
        end_text=duration_data["end"],
        end_iso=end_iso,
        duration_months=duration_months,
        incomplete=False,
    )


def _parse_entry_without_duration(
    lines: Sequence[str],
    start_idx: int,
    duration_lines: Dict[int, Dict[str, str]],
) -> Optional[Tuple[EducationEntry, int]]:
    """Parse an education entry when no duration pattern is detected.

    This function applies heuristics to identify entry boundaries when duration
    patterns are absent. It identifies the institution line, looks ahead for
    degree text, and detects the next institution line to determine entry end.

    Args:
        lines: Sequence of all text lines
        start_idx: Index of the potential institution line
        duration_lines: Dictionary of line indices that contain duration patterns

    Returns:
        Tuple of (EducationEntry with incomplete=True, next_line_index) or None
        if parsing fails. The next_line_index indicates where to continue parsing.
    """
    # The current line should be the institution
    institution_line = lines[start_idx].strip()

    # Skip if this line is empty or contains a duration pattern
    if not institution_line or start_idx in duration_lines:
        return None

    # Check if this line starts with a capital letter
    if not institution_line[0].isupper():
        return None

    # Check if this line contains degree indicators (if so, it's not an institution)
    institution_lower = institution_line.lower()
    for indicator in DEGREE_INDICATORS:
        if indicator in institution_lower:
            return None

    # Check if this looks like a fragment (very short line that might be continuation)
    # If the line is very short (< 15 chars) and lowercase, it might be a fragment
    if len(institution_line) < 15 and institution_line.lower() in [
        "school",
        "college",
        "university",
        "institute",
    ]:
        return None

    # This line is the institution
    institution = institution_line

    # Look ahead for degree text until we find next institution
    degree_lines = []
    current_idx = start_idx + 1
    next_institution_idx = None
    found_degree_content = False
    blank_line_count = 0

    while current_idx < len(lines):
        line = lines[current_idx].strip()

        # If we hit a blank line, track it but continue looking
        if not line:
            blank_line_count += 1
            # If we've seen 2+ consecutive blank lines, stop
            if blank_line_count >= 2:
                next_non_blank = _next_non_empty(lines, current_idx)
                if next_non_blank is not None:
                    next_institution_idx = next_non_blank
                break
            current_idx += 1
            continue

        # Reset blank line counter when we see content
        blank_line_count = 0

        # Check if this line contains a duration pattern (indicates next entry)
        if current_idx in duration_lines:
            break

        # Check if this line looks like a new institution
        line_lower = line.lower()
        has_degree_indicator = any(
            indicator in line_lower for indicator in DEGREE_INDICATORS
        )

        # If this line has degree indicators, it's definitely part of the degree
        if has_degree_indicator:
            degree_lines.append(line)
            found_degree_content = True
            current_idx += 1
            continue

        # If this line has degree indicators, it's definitely part of the degree
        # (already handled above, this is just for clarity)

        # If we've already found degree content and this line starts with capital
        # and has no degree indicators, it might be a new institution
        if found_degree_content and line[0].isupper():
            # Check if the previous line ended with continuation indicators
            prev_line = degree_lines[-1] if degree_lines else ""
            if not (
                prev_line.endswith(",")
                or prev_line.endswith("and")
                or prev_line.endswith("&")
            ):
                # This looks like a new institution
                next_institution_idx = current_idx
                break

        # If we haven't found degree content yet, we need to be more careful
        # After collecting 1-2 lines without degree indicators, if we see another
        # capitalized line, it's likely a new institution
        if not found_degree_content:
            # If we already have some degree lines and this line doesn't look like
            # a continuation, treat it as a new institution
            if len(degree_lines) >= 1 and line[0].isupper():
                # Check if previous line looks complete (not a fragment)
                prev_line = degree_lines[-1] if degree_lines else ""
                # If previous line doesn't end with comma or conjunction, this is likely new institution
                if not (
                    prev_line.endswith(",")
                    or prev_line.endswith("and")
                    or prev_line.endswith("&")
                    or len(prev_line) < 20  # Very short lines might be fragments
                ):
                    next_institution_idx = current_idx
                    break

        # Collect this line as part of the degree
        degree_lines.append(line)
        current_idx += 1

    # Combine degree lines into a single string
    degree_text = " ".join(degree_lines) if degree_lines else None

    # Determine the next line to parse
    if next_institution_idx is not None:
        next_idx = next_institution_idx
    else:
        next_idx = current_idx

    # Create entry with incomplete=True
    entry = EducationEntry(
        institution=institution,
        degree=degree_text,
        incomplete=True,
    )

    return entry, next_idx


# --- Main parsing orchestration ----------------------------------------------


def parse_education_section(raw_text: str) -> List[Dict[str, object]]:
    """Parse a raw education section into structured entries.

    This function orchestrates the complete parsing workflow:
    1. Normalize input lines and remove page footers
    2. Detect all duration lines for deterministic parsing
    3. Iterate through lines to identify entry boundaries
    4. Route to deterministic parser when duration is present
    5. Route to heuristic parser when duration is absent
    6. Collect all parsed entries and return as list of dictionaries

    Args:
        raw_text: The markdown text from the Education H2 section

    Returns:
        A list of education entry dictionaries with keys:
        - institution: str
        - degree: Optional[str]
        - start_date_text: Optional[str]
        - start_date: Optional[str] (ISO format YYYY-MM-DD)
        - end_date_text: Optional[str]
        - end_date: Optional[str] (ISO format YYYY-MM-DD)
        - duration_months: Optional[int]
        - incomplete: Optional[bool] (only present when True)
    """
    # Step 1: Normalize input lines
    lines = _normalise_lines(raw_text)

    # Step 2: Handle empty input
    if not lines or all(not line.strip() for line in lines):
        return []

    # Step 3: Detect all duration lines
    duration_lines = _find_duration_lines(lines)

    # Step 4: Iterate through lines and parse entries
    entries: List[EducationEntry] = []
    processed_indices = set()
    idx = 0

    while idx < len(lines):
        # Skip if we've already processed this line
        if idx in processed_indices:
            idx += 1
            continue

        line = lines[idx].strip()

        # Skip blank lines
        if not line:
            idx += 1
            continue

        # Step 5: Route to deterministic parser when duration is present
        if idx in duration_lines:
            duration_data = duration_lines[idx]
            try:
                entry = _parse_entry_with_duration(lines, idx, duration_data)
                if entry:
                    entries.append(entry)

                    # Mark all lines in this entry as processed
                    # Find the start of this entry by searching backward
                    entry_start = idx
                    search_idx = idx - 1
                    while search_idx >= 0 and search_idx not in processed_indices:
                        if not lines[search_idx].strip():
                            break
                        if search_idx in duration_lines and search_idx != idx:
                            break
                        entry_start = search_idx
                        search_idx -= 1

                    # Mark all lines from entry start to duration end as processed
                    # For multiline durations, include the continuation line
                    duration_end = duration_data.get("end_line", idx)
                    for i in range(entry_start, duration_end + 1):
                        processed_indices.add(i)
            except Exception as e:
                logger.error(f"Error parsing entry with duration at line {idx}: {e}")
                # Continue processing remaining entries

            idx += 1
            continue

        # Step 6: Route to heuristic parser when duration is absent
        # Check if this line could be an institution (not already processed)
        # Also check if the next line contains a duration (if so, skip - will be handled by deterministic parser)
        next_line_idx = _next_non_empty(lines, idx + 1)
        if next_line_idx is not None and next_line_idx in duration_lines:
            # This institution will be handled by the deterministic parser
            idx += 1
            continue

        if line and line[0].isupper():
            try:
                result = _parse_entry_without_duration(lines, idx, duration_lines)
                if result:
                    entry, next_idx = result
                    entries.append(entry)
                    logger.debug(
                        f"Applied heuristic parsing for entry at line {idx}: {entry.institution}"
                    )

                    # Mark all lines from current to next_idx as processed
                    for i in range(idx, next_idx):
                        processed_indices.add(i)

                    idx = next_idx
                    continue
            except Exception as e:
                logger.error(f"Error parsing entry without duration at line {idx}: {e}")
                # Continue processing remaining entries

        idx += 1

    # Step 7: Collect all parsed entries and return as list of dictionaries
    return [entry.as_dict() for entry in entries]


__all__ = ["EducationEntry", "parse_education_section"]
