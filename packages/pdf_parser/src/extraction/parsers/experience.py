"""Parser for LinkedIn experience sections.

The parsing strategy follows a timeline-first approach operating on the raw
markdown extracted from a LinkedIn PDF. Company groupings are driven purely by
layout: a company header line immediately followed by a duration summary line.
Roles are anchored by timeline lines, with titles situated directly above the
timeline. The span between a role's timeline and the next structural boundary
is interpreted as optional location plus highlights.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Set, Tuple
import re

# --- Regular expressions -----------------------------------------------------

TIMELINE_RE = re.compile(
    r"(?ix)^\s*"
    r"(?P<start>(?:[A-Za-z]{3,}\.?\s+\d{4}|\d{4}))"
    r"\s*-\s*"
    r"(?P<end>(?:Present|present|[A-Za-z]{3,}\.?\s+\d{4}|\d{4}))"
    r"(?:\s*\(\s*(?P<duration>[^)]+)\s*\))?"
    r"\s*$"
)

COMPANY_DURATION_RE = re.compile(
    r"(?ix)^\s*(?:(?P<yrs>\d+)\s+years?(?:\s+(?P<mns>\d+)\s+months?)?|(?P<only_mns>\d+)\s+months?)\s*$"
)

PAGE_FOOTER_RE = re.compile(r"(?ix)^\s*page\s*\d+(?:\s*of\s*\d+)?\s*$")

LOCATION_RE = re.compile(r"^[A-Z][A-Za-z0-9&\-\s,]{0,80}$")


MONTH_MAP: Dict[str, str] = {
    "jan": "01",
    "january": "01",
    "feb": "02",
    "february": "02",
    "mar": "03",
    "march": "03",
    "apr": "04",
    "april": "04",
    "may": "05",
    "jun": "06",
    "june": "06",
    "jul": "07",
    "july": "07",
    "aug": "08",
    "august": "08",
    "sep": "09",
    "sept": "09",
    "september": "09",
    "oct": "10",
    "october": "10",
    "nov": "11",
    "november": "11",
    "dec": "12",
    "december": "12",
}


# --- Data containers ---------------------------------------------------------


def _compact(mapping: Dict[str, Optional[object]]) -> Dict[str, object]:
    return {key: value for key, value in mapping.items() if value is not None}


@dataclass
class RoleRecord:
    title: str
    start_text: Optional[str]
    start_iso: Optional[str]
    end_text: Optional[str]
    end_iso: Optional[str]
    is_current: bool
    duration_text: Optional[str]
    duration_months: Optional[int]
    location: Optional[str]
    highlights: Optional[str] = None

    def as_dict(self) -> Dict[str, object]:
        payload: Dict[str, Optional[object]] = {
            "title": self.title or None,
            "start_date_text": self.start_text,
            "start_date": self.start_iso,
            "end_date_text": self.end_text,
            "end_date": self.end_iso,
            "is_current": self.is_current if self.is_current else None,
            "duration_text": self.duration_text,
            "duration_months": self.duration_months,
            "location": self.location,
            "highlights": self.highlights,
        }
        return _compact(payload)


@dataclass
class CompanyGroup:
    header_idx: int
    duration_idx: int
    company_name: str
    duration_text: str
    total_duration_months: Optional[int]
    roles: List[RoleRecord] = field(default_factory=list)
    remaining_months: Optional[int] = None
    incomplete: bool = False

    def __post_init__(self) -> None:
        self.remaining_months = self.total_duration_months

    def as_dict(self) -> Dict[str, object]:
        payload: Dict[str, Optional[object]] = {
            "type": "company_group",
            "company_name": self.company_name,
            "duration_text": self.duration_text,
            "duration_months": self.total_duration_months,
            "incomplete": self.incomplete if self.incomplete else None,
            "roles": [role.as_dict() for role in self.roles],
        }
        return _compact(payload)


@dataclass
class StandaloneRole:
    company_name: Optional[str]
    role: RoleRecord

    def as_dict(self) -> Dict[str, object]:
        payload: Dict[str, Optional[object]] = {
            "type": "standalone_role",
            "company_name": self.company_name,
            **self.role.as_dict(),
        }
        return _compact(payload)


# --- Normalisation utilities -------------------------------------------------


def _normalise_lines(text: str) -> List[str]:
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
    for idx in range(start, len(lines)):
        if lines[idx].strip():
            return idx
    return None


def _previous_non_empty(lines: Sequence[str], start: int) -> Optional[int]:
    for idx in range(start, -1, -1):
        if lines[idx].strip():
            return idx
    return None


# --- Pattern helpers ---------------------------------------------------------


def _parse_company_duration(text: str) -> Optional[int]:
    match = COMPANY_DURATION_RE.match(text.strip())
    if not match:
        return None
    yrs = match.group("yrs")
    mns = match.group("mns")
    only_months = match.group("only_mns")
    total = 0
    if yrs:
        total += int(yrs) * 12
    if mns:
        total += int(mns)
    if only_months:
        total += int(only_months)
    return total if total > 0 else None


def _parse_duration_to_months(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    return _parse_company_duration(text)


def _parse_timeline(line: str) -> Optional[Dict[str, Optional[str]]]:
    match = TIMELINE_RE.match(line.strip())
    if not match:
        return None
    return {
        "start": match.group("start"),
        "end": match.group("end"),
        "duration": match.group("duration"),
    }


def _parse_date_to_iso(value: Optional[str]) -> Tuple[Optional[str], str]:
    if not value:
        return None, "unknown"
    raw = value.strip()
    if re.match(r"(?i)^present$", raw):
        return None, "present"
    match = re.match(r"(?ix)^(?P<mon>[A-Za-z]{3,})\.?\s+(?P<yr>\d{4})$", raw)
    if match:
        month_token = match.group("mon").lower().rstrip(".")
        month_code = MONTH_MAP.get(month_token[:3], MONTH_MAP.get(month_token))
        if month_code:
            return f"{match.group('yr')}-{month_code}-01", "month"
        return f"{match.group('yr')}-01-01", "year"
    numeric_match = re.match(r"^\s*(\d{4})\s*$", raw)
    if numeric_match:
        return f"{numeric_match.group(1)}-01-01", "year"
    return None, "unknown"


def _months_between(start_iso: Optional[str], end_iso: Optional[str]) -> Optional[int]:
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


def _is_location_line(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False
    if stripped.endswith("."):
        return False
    if len(stripped) > 100:
        return False
    if not any(ch.islower() for ch in stripped if ch.isalpha()):
        return False
    return bool(LOCATION_RE.match(stripped))


# --- Core parsing ------------------------------------------------------------


def parse_experience_section(raw_text: str) -> List[Dict[str, object]]:
    """Parse a raw experience section into structured entries."""

    lines = _normalise_lines(raw_text)
    if not lines:
        return []

    timeline_indices = sorted(
        idx for idx, line in enumerate(lines) if TIMELINE_RE.match(line.strip())
    )
    if not timeline_indices:
        return []

    title_for_timeline: Dict[int, Optional[int]] = {}
    for t_idx in timeline_indices:
        title_idx = _previous_non_empty(lines, t_idx - 1)
        title_for_timeline[t_idx] = title_idx

    header_groups: List[CompanyGroup] = []
    for idx, line in enumerate(lines):
        if not line.strip():
            continue
        next_idx = _next_non_empty(lines, idx + 1)
        if next_idx is None:
            continue
        duration_months = _parse_company_duration(lines[next_idx])
        if duration_months is None:
            continue
        header_groups.append(
            CompanyGroup(
                header_idx=idx,
                duration_idx=next_idx,
                company_name=line.strip(),
                duration_text=lines[next_idx].strip(),
                total_duration_months=duration_months,
            )
        )

    header_groups.sort(key=lambda grp: grp.header_idx)

    header_indices: Set[int] = {group.header_idx for group in header_groups}
    duration_indices: Set[int] = {group.duration_idx for group in header_groups}
    title_indices: Set[int] = {
        idx for idx in title_for_timeline.values() if idx is not None
    }
    timeline_indices_set: Set[int] = set(timeline_indices)

    role_infos: List[Dict[str, object]] = []
    active_headers: List[CompanyGroup] = []
    header_activation_idx = 0

    for timeline_idx in timeline_indices:
        while (
            header_activation_idx < len(header_groups)
            and header_groups[header_activation_idx].duration_idx < timeline_idx
        ):
            active_headers.append(header_groups[header_activation_idx])
            header_activation_idx += 1

        timeline_data = _parse_timeline(lines[timeline_idx])
        if not timeline_data:
            continue

        title_idx = title_for_timeline.get(timeline_idx)
        header = _select_active_header(active_headers)

        start_iso, start_precision = _parse_date_to_iso(timeline_data.get("start"))
        end_iso, end_precision = _parse_date_to_iso(timeline_data.get("end"))
        duration_text = timeline_data.get("duration")
        duration_months = _parse_duration_to_months(duration_text)
        if (
            duration_months is None
            and start_iso
            and end_iso
            and end_precision != "present"
        ):
            duration_months = _months_between(start_iso, end_iso)

        company_name: Optional[str] = None
        company_idx: Optional[int] = None
        if header is None:
            company_name, company_idx = _infer_standalone_company(
                lines,
                title_idx,
                header_indices,
                duration_indices,
                timeline_indices_set,
                title_indices,
            )

        if header is not None and header.remaining_months is not None:
            if duration_months is None:
                header.incomplete = True
            else:
                header.remaining_months = max(
                    0, header.remaining_months - duration_months
                )
                if header.remaining_months == 0:
                    active_headers = [
                        grp for grp in active_headers if grp is not header
                    ]
        elif header is not None and duration_months is None:
            header.incomplete = True

        role_infos.append(
            {
                "timeline_idx": timeline_idx,
                "title_idx": title_idx,
                "header": header,
                "company_name": company_name,
                "company_idx": company_idx,
                "timeline_data": timeline_data,
                "start_iso": start_iso,
                "start_precision": start_precision,
                "end_iso": end_iso,
                "end_precision": end_precision,
                "duration_text": duration_text,
                "duration_months": duration_months,
            }
        )

    header_first_seen: Set[int] = set()
    for role in role_infos:
        header = role["header"]
        title_idx = role["title_idx"]
        company_idx = role["company_idx"]
        if header is not None:
            header_idx = header.header_idx
            if header_idx not in header_first_seen:
                role["block_start"] = header_idx
                header_first_seen.add(header_idx)
            else:
                role["block_start"] = (
                    title_idx if title_idx is not None else role["timeline_idx"]
                )
        else:
            if company_idx is not None:
                role["block_start"] = company_idx
            elif title_idx is not None:
                role["block_start"] = title_idx
            else:
                role["block_start"] = role["timeline_idx"]

    for idx, role in enumerate(role_infos):
        if idx + 1 < len(role_infos):
            role["next_block_start"] = role_infos[idx + 1]["block_start"]
        else:
            role["next_block_start"] = len(lines)

    standalone_entries: List[Tuple[int, StandaloneRole]] = []

    for role in role_infos:
        timeline_idx = role["timeline_idx"]
        title_idx = role["title_idx"]
        timeline_data = role["timeline_data"]

        location, highlight_text = _extract_location_and_highlights_between(
            lines,
            timeline_idx,
            role["next_block_start"],
        )

        role_record = RoleRecord(
            title=lines[title_idx].strip() if title_idx is not None else "",
            start_text=timeline_data.get("start"),
            start_iso=role["start_iso"],
            end_text=timeline_data.get("end"),
            end_iso=role["end_iso"],
            is_current=role["end_precision"] == "present",
            duration_text=role["duration_text"],
            duration_months=role["duration_months"],
            location=location,
            highlights=highlight_text,
        )

        header = role["header"]
        if header is not None:
            header.roles.append(role_record)
        else:
            placement_idx = (
                role["company_idx"]
                if role["company_idx"] is not None
                else (title_idx if title_idx is not None else role["timeline_idx"])
            )
            standalone_entries.append(
                (
                    placement_idx,
                    StandaloneRole(role["company_name"], role_record),
                )
            )

    for group in header_groups:
        if group.remaining_months is not None and group.remaining_months > 0:
            group.incomplete = True

    group_entries: List[Tuple[int, CompanyGroup]] = [
        (group.header_idx, group) for group in header_groups if group.roles
    ]

    combined: List[Tuple[int, Dict[str, object]]] = []
    for order_idx, group in group_entries:
        combined.append((order_idx, group.as_dict()))
    for order_idx, entry in standalone_entries:
        combined.append((order_idx, entry.as_dict()))

    combined.sort(key=lambda item: item[0])
    return [payload for _, payload in combined]


def _infer_standalone_company(
    lines: Sequence[str],
    title_idx: Optional[int],
    header_indices: Set[int],
    duration_indices: Set[int],
    timeline_indices: Set[int],
    title_indices: Set[int],
) -> Tuple[Optional[str], Optional[int]]:
    if title_idx is None:
        return None, None
    cursor = title_idx - 1
    stop_markers = header_indices | duration_indices | timeline_indices | title_indices
    while cursor >= 0:
        line = lines[cursor].strip()
        if not line:
            cursor -= 1
            continue
        if COMPANY_DURATION_RE.match(line):
            cursor -= 1
            continue
        if cursor in stop_markers:
            break
        return line, cursor
    return None, None


def _select_active_header(
    active_headers: Sequence[CompanyGroup],
) -> Optional[CompanyGroup]:
    for group in reversed(active_headers):
        if group.remaining_months is None or group.remaining_months > 0:
            return group
    return None


def _extract_location_and_highlights_between(
    lines: Sequence[str],
    timeline_idx: int,
    boundary_idx: int,
) -> Tuple[Optional[str], Optional[str]]:
    if boundary_idx <= timeline_idx:
        boundary_idx = timeline_idx + 1

    span_lines = [line.rstrip() for line in lines[timeline_idx + 1 : boundary_idx]]

    first_content_idx = None
    for offset, line in enumerate(span_lines):
        if line.strip():
            first_content_idx = offset
            break

    if first_content_idx is None:
        return None, None

    location: Optional[str] = None
    highlights_start = first_content_idx
    candidate = span_lines[first_content_idx]
    if _is_location_line(candidate):
        location = candidate.strip()
        highlights_start = first_content_idx + 1

    highlight_block = "\n".join(span_lines[highlights_start:]).strip()
    highlight_text = highlight_block if highlight_block else None
    return location, highlight_text


__all__ = ["parse_experience_section"]
