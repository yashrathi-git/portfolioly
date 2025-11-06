# Design Document

## Overview

The education parser extends the linkedin-extractor system by adding a new parser module at `src/extraction/parsers/education.py`. The design follows the same architectural patterns established by the experience parser: it operates on raw markdown text extracted from an H2 section, applies pattern matching to identify structural boundaries, and returns a list of structured dictionaries.

The parser handles three distinct formatting scenarios:

1. **Complete entries** with institution, degree, and duration
2. **Partial entries** with institution and degree but no duration
3. **Minimal entries** with only institution name

The design prioritizes deterministic parsing when duration patterns are present and applies conservative heuristics when they are absent.

## Architecture

### Module Structure

```
src/extraction/parsers/
├── __init__.py
├── experience.py (existing)
└── education.py (new)
```

The education parser will be imported and invoked from `bin/extract_markdown.py` following the same pattern as the experience parser.

### Integration Points

1. **CLI Entry Point** (`bin/extract_markdown.py`):

   - Import `parse_education_section` from `src.extraction.parsers.education`
   - Extract the "Education" section from `extraction.after_h1.sections`
   - Invoke the parser and store results under `payload["parsed_sections"]["Education"]`

2. **Markdown Extractor** (`src/extraction/markdown_extractor.py`):

   - No changes required; the existing H2 section extraction provides the input text

3. **Parser Module** (`src/extraction/parsers/education.py`):
   - New module implementing `parse_education_section(raw_text: str) -> List[Dict[str, object]]`

## Components and Interfaces

### Core Function Signature

```python
def parse_education_section(raw_text: str) -> List[Dict[str, object]]:
    """Parse a raw education section into structured entries.

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
        - incomplete: bool (true when heuristics are used)
    """
```

### Regular Expression Patterns

```python
# Duration pattern: (YYYY - YYYY) or (Month YYYY - Month YYYY)
# Note: Handles both "September 2022" and "September2022" (with or without space)
DURATION_RE = re.compile(
    r"(?ix)\(\s*"
    r"(?P<start>(?:[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Present|present|[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*\)"
)

# Inline degree with duration: "Degree Name · (YYYY - YYYY)"
# Note: Handles both "September 2022" and "September2022" (with or without space)
INLINE_DEGREE_DURATION_RE = re.compile(
    r"(?ix)^(?P<degree>.+?)\s*[·•]\s*\(\s*"
    r"(?P<start>(?:[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*[-–—]\s*"
    r"(?P<end>(?:Present|present|[A-Za-z]{3,}\.?\s*\d{4}|\d{4}))"
    r"\s*\)\s*$"
)

# Degree indicators for heuristic boundary detection
DEGREE_INDICATORS = [
    "bachelor", "master", "phd", "ph.d", "doctorate", "diploma",
    "certificate", "associate", "degree", "b.s.", "b.a.", "m.s.",
    "m.a.", "m.b.a.", "b.tech", "m.tech", "b.e.", "m.e."
]

# Page footer pattern (reused from experience parser)
PAGE_FOOTER_RE = re.compile(r"(?ix)^\s*page\s*\d+(?:\s*of\s*\d+)?\s*$")
```

### Data Structures

```python
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
        """Convert to dictionary for JSON serialization."""
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
```

## Parsing Algorithm

### Phase 1: Line Normalization

1. Split text into lines and strip trailing whitespace
2. Remove page footer lines matching `PAGE_FOOTER_RE`
3. Collapse consecutive blank lines into single blank lines
4. Return normalized line list

**Reuse**: The `_normalise_lines` function from `experience.py` can be reused directly.

### Phase 2: Duration Line Detection

Scan all lines to identify duration patterns:

```python
duration_lines: Dict[int, Dict[str, str]] = {}
for idx, line in enumerate(lines):
    match = DURATION_RE.search(line)
    if match:
        duration_lines[idx] = {
            "start": match.group("start"),
            "end": match.group("end"),
        }
```

### Phase 3: Entry Boundary Detection

**Strategy A: Duration-Anchored Parsing** (when duration is present)

1. For each duration line at index `d_idx`:
   - Search backward to find the institution line (first non-empty line that is not a duration)
   - All lines between institution and duration are degree text
   - Check if degree and duration are on the same line (inline format)

**Strategy B: Heuristic Parsing** (when duration is absent)

1. Identify potential institution lines (lines starting with capital letter, not matching degree indicators)
2. Look ahead up to 3 lines for degree indicators
3. If a degree indicator is found, treat subsequent lines as part of the same entry
4. If the next line looks like a new institution (capital letter, no degree indicators), start a new entry
5. Mark entry as `incomplete=True`

### Phase 4: Date Normalization

Reuse the date parsing logic from `experience.py`, with enhancement to handle dates without spaces:

```python
def _parse_date_to_iso(value: Optional[str]) -> Tuple[Optional[str], str]:
    """Convert date text to ISO format.

    Handles formats:
    - "2022" (year only)
    - "March 2022" (month with space)
    - "March2022" (month without space)
    - "Present" (ongoing)

    Returns:
        (iso_date, precision) where precision is "year", "month", "present", or "unknown"
    """
```

### Phase 5: Duration Calculation

```python
def _months_between(start_iso: Optional[str], end_iso: Optional[str]) -> Optional[int]:
    """Calculate months between two ISO dates."""
```

Reuse from `experience.py`.

## Detailed Parsing Logic

### Scenario 1: Complete Entry with Duration

```
North Carolina State University
Doctor of Philosophy (Ph.D.), Biomathematics, Bioinformatics, and
Computational Biology
```

**No duration present** → Apply heuristic:

- Line 1: Institution = "North Carolina State University"
- Lines 2-3: Degree = "Doctor of Philosophy (Ph.D.), Biomathematics, Bioinformatics, and Computational Biology"
- Mark as `incomplete=True`

### Scenario 2: Inline Degree with Duration

```
Bachelor's degree, Computer Science · (2022 - 2026)
```

**Duration present** → Deterministic parsing:

- Institution: "Vellore Institute of Technology" (from previous line)
- Degree: "Bachelor's degree, Computer Science"
- Duration: (2022 - 2026)
- Mark as `incomplete=False`

### Scenario 2b: Inline Degree with Duration (No Space in Date)

```
Bachelor of Technology - BTech, Computer Science · (September2022 - September 2026)
```

**Duration present with no space between month and year** → Deterministic parsing:

- Institution: "Vellore Institute of Technology" (from previous line)
- Degree: "Bachelor of Technology - BTech, Computer Science"
- Duration: (September2022 - September 2026)
- Parser must handle dates with or without spaces between month and year
- Mark as `incomplete=False`

### Scenario 2c: Multi-line Duration Pattern

```
Bachelor of Technology - BTech, Computer Science · (September
2022 - September 2026)
```

**Duration split across multiple lines** → Deterministic parsing with line joining:

- Institution: "Vellore Institute of Technology" (from previous line)
- Degree: "Bachelor of Technology - BTech, Computer Science"
- Duration: Lines must be joined before pattern matching
- Parser must detect incomplete duration patterns and look ahead to next line
- Mark as `incomplete=False`

### Scenario 3: Multi-line with Duration

```
Vellore Institute of Technology
Bachelor's degree, Computer Science · (2022 - 2026)
```

**Duration present** → Deterministic parsing:

- Institution: "Vellore Institute of Technology"
- Degree: "Bachelor's degree, Computer Science"
- Duration: (2022 - 2026)
- Mark as `incomplete=False`

### Scenario 4: Institution Only

```
University of North Carolina at Chapel Hill - Kenan-Flagler Business
School
Business / StartUp UNC / Entrepreneurship
```

**No duration, no clear degree indicators** → Heuristic:

- Institution: "University of North Carolina at Chapel Hill - Kenan-Flagler Business School"
- Degree: "Business / StartUp UNC / Entrepreneurship"
- Mark as `incomplete=True`

## Error Handling

### Empty or Malformed Input

```python
def parse_education_section(raw_text: str) -> List[Dict[str, object]]:
    lines = _normalise_lines(raw_text)
    if not lines or all(not line.strip() for line in lines):
        return []
```

### Unrecognized Date Formats

When `_parse_date_to_iso` returns `("unknown", None)`:

- Store the raw text in `start_date_text` or `end_date_text`
- Set `start_date` or `end_date` to `None`
- Continue processing

### Parsing Failures

- Log warnings when heuristic parsing is applied
- Continue processing remaining entries if one entry fails
- Skip entries where institution cannot be identified

## Testing Strategy

### Unit Tests

1. **Duration Pattern Matching**

   - Test `DURATION_RE` against various formats: `(2022 - 2026)`, `(March 2014 - March 2015)`, `(April 2016 - Present)`
   - Test `INLINE_DEGREE_DURATION_RE` for inline formats

2. **Date Normalization**

   - Test `_parse_date_to_iso` with year-only, month-year, and "Present" inputs
   - Test `_months_between` for duration calculation

3. **Entry Parsing**

   - Test complete entries with duration
   - Test partial entries without duration
   - Test minimal entries with institution only
   - Test inline degree formats
   - Test multi-line degree formats

4. **Edge Cases**
   - Empty input
   - Single institution line
   - Consecutive entries without blank lines
   - Entries with special characters in institution names

### Integration Tests

1. **End-to-End Parsing**

   - Parse sample profiles (StatQuest, YashRathi, Amritansh)
   - Verify JSON output structure
   - Verify `incomplete` flag is set correctly

2. **CLI Integration**
   - Run `bin/extract_markdown.py` with sample inputs
   - Verify `parsed_sections.Education` is populated
   - Verify output file format

### Test Data

Use the existing sample profiles in `extracted_text/`:

- `StatQuest.md`: Multiple entries, no durations
- `YashRathiProfile.md`: Entries with inline durations
- `amritansh.md`: Mixed formats with and without durations

## Implementation Notes

### Code Reuse

The following utilities from `experience.py` can be reused:

- `_normalise_lines`: Line normalization and page footer removal
- `_parse_date_to_iso`: Date parsing and ISO conversion
- `_months_between`: Duration calculation
- `MONTH_MAP`: Month name to number mapping
- `PAGE_FOOTER_RE`: Page footer pattern

### Differences from Experience Parser

1. **No company grouping**: Education entries are flat, no nested structures
2. **Simpler timeline detection**: Duration is always in parentheses, not followed by separate duration text
3. **More aggressive heuristics**: Education sections often lack durations, requiring fallback logic
4. **No location field**: Education entries don't typically include location in the same way as experience
