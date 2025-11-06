# Design Document

## Overview

This design extends the LinkedIn Profile System to parse the remaining profile sections (Contact, Languages, Certifications, Honors-Awards, Top Skills) and provides a unified API function for complete profile extraction. The design follows the existing architecture pattern where each section has a dedicated parser module that operates on raw markdown text and returns structured data.

The key challenge addressed is handling linebreaks that occur in the before_h1 sections due to narrow PDF column widths. The design includes a text normalization utility that intelligently joins fragmented lines while preserving intentional structure.

## Architecture

### Module Structure

```
src/extraction/
├── __init__.py                    # Updated with new parser exports
├── markdown_extractor.py          # Existing base extractor (no changes)
├── parsers/
│   ├── __init__.py               # Parser module exports
│   ├── experience.py             # Existing (no changes)
│   ├── education.py              # Existing (no changes)
│   ├── contact.py                # NEW: Contact section parser
│   ├── languages.py              # NEW: Languages section parser
│   ├── certifications.py         # NEW: Certifications section parser
│   ├── honors_awards.py          # NEW: Honors-Awards section parser
│   ├── top_skills.py             # NEW: Top Skills section parser
│   └── utils.py                  # NEW: Shared parsing utilities
└── api.py                         # NEW: Unified parsing API
```

### Data Flow

1. **Input**: Raw markdown text (string)
2. **Base Extraction**: `extract_markdown_from_text()` splits document into before_h1 and after_h1 sections
3. **Section Parsing**: Individual parsers process their respective sections
4. **Unified API**: `parse_profile()` orchestrates all parsers and aggregates results
5. **Output**: Structured JSON with all parsed sections

## Components and Interfaces

### 1. Text Normalization Utility (`src/extraction/parsers/utils.py`)

**Purpose**: Provide shared utilities for handling linebreaks and text normalization in before_h1 sections.

**Key Pattern Discovery**:
Based on analysis of actual LinkedIn PDF exports, the linebreak pattern is deterministic:

- **Double linebreak (`\n\n`)**: Separates distinct items (different skills, certifications, contact entries)
- **Single linebreak (`\n`)**: Indicates text continuation due to narrow PDF column width (URLs split, text wrapped)

**Key Functions**:

```python
def normalize_before_h1_text(text: str) -> str:
    """
    Normalize text from before_h1 sections by joining fragmented lines.

    Deterministic Strategy:
    - Split text on double linebreaks (\n\n) to identify distinct items
    - Within each item, join lines separated by single linebreaks
    - Preserve the double linebreak structure for item separation
    - Remove extra whitespace when joining single-linebreak fragments
    """

def extract_items(text: str) -> List[str]:
    """
    Split text into logical items based on double linebreaks.
    Each item may contain text that was split across multiple lines.
    Returns list of items with single-linebreak fragments joined.
    """

def join_single_linebreaks(text: str) -> str:
    """
    Join text fragments separated by single linebreaks.
    Handles URLs, markdown links, and regular text.
    Preserves double linebreaks as item separators.
    """
```

**Implementation Notes**:

- Split on `\n\n` to get distinct items
- Within each item, replace `\n` with space to join fragments
- Trim whitespace from each item
- Special handling for markdown links that may span lines: `[text](url)`
- No complex heuristics needed - the pattern is consistent across all samples

### 2. Contact Parser (`src/extraction/parsers/contact.py`)

**Purpose**: Parse contact information into structured platform-profile pairs.

**Function Signature**:

```python
def parse_contact_section(raw_text: str) -> Dict[str, str]:
    """
    Parse contact section into structured dictionary.

    Returns:
        {
            "email": "user@example.com",
            "phone": "1234567890",
            "LinkedIn": "https://linkedin.com/in/username",
            "GitHub": "https://github.com/username",
            "Personal": "https://example.com",
            ...
        }
    """
```

**Parsing Strategy**:

1. Normalize text using `normalize_before_h1_text()`
2. Extract lines and join URL fragments
3. For each line:
   - Check for email pattern (contains `@` and domain)
   - Check for phone pattern (digits with optional formatting)
   - Check for markdown link with platform label: `[url](url) (Platform)`
   - Check for bare URL and infer platform from domain
4. Extract platform labels from parentheses: `(LinkedIn)`, `(GitHub)`, etc.
5. Map common domains to platforms: `linkedin.com` → `LinkedIn`, `github.com` → `GitHub`

**Regex Patterns**:

- Email: `r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'`
- Phone: `r'\d[\d\s\-\(\)]{7,}'` (with label extraction)
- Markdown link: `r'\[([^\]]+)\]\(([^\)]+)\)'`
- Platform label: `r'\(([^)]+)\)\s*$'`

**Platform Inference**:

- `linkedin.com` → `LinkedIn`
- `github.com` → `GitHub`
- `twitter.com`, `x.com` → `Twitter`
- Other domains → `Personal` or domain name

### 3. Languages Parser (`src/extraction/parsers/languages.py`)

**Purpose**: Parse languages section into list of language-proficiency pairs.

**Function Signature**:

```python
def parse_languages_section(raw_text: str) -> List[Dict[str, Optional[str]]]:
    """
    Parse languages section into structured list.

    Returns:
        [
            {"language": "English", "proficiency_level": "Native or Bilingual"},
            {"language": "Spanish", "proficiency_level": "Professional Working"},
            {"language": "French", "proficiency_level": None}
        ]
    """
```

**Parsing Strategy**:

1. Normalize text using `normalize_before_h1_text()`
2. Extract lines
3. For each line:
   - Check if line contains proficiency indicator in parentheses
   - Pattern: `Language Name (Proficiency Level)`
   - If no parentheses, treat entire line as language name with null proficiency
4. Return list maintaining original order

**Proficiency Patterns**:

- Look for parentheses at end of line: `r'^(.+?)\s*\(([^)]+)\)\s*$'`
- Common proficiency levels: Native, Bilingual, Professional, Limited, Elementary

### 4. Certifications Parser (`src/extraction/parsers/certifications.py`)

**Purpose**: Parse certifications section into list of certification names.

**Function Signature**:

```python
def parse_certifications_section(raw_text: str) -> List[str]:
    """
    Parse certifications section into list of certification names.

    Returns:
        [
            "AWS Certified Solutions Architect",
            "Deep Learning Specialization",
            ...
        ]
    """
```

**Parsing Strategy**:

1. Normalize text using `normalize_before_h1_text()`
2. Extract lines
3. Each non-empty line is a certification
4. Return list maintaining original order

### 5. Honors-Awards Parser (`src/extraction/parsers/honors_awards.py`)

**Purpose**: Parse honors and awards section into list of award names.

**Function Signature**:

```python
def parse_honors_awards_section(raw_text: str) -> List[str]:
    """
    Parse honors-awards section into list of award names.

    Returns:
        [
            "Winner @ VIT Internal Student Hackathon",
            "Best Paper Award at ICB 2018",
            ...
        ]
    """
```

**Parsing Strategy**:

1. Normalize text using `normalize_before_h1_text()`
2. Extract lines
3. Each non-empty line is an award
4. Return list maintaining original order

**Note**: This parser is nearly identical to certifications parser but kept separate for semantic clarity and potential future enhancements (e.g., date extraction).

### 6. Top Skills Parser (`src/extraction/parsers/top_skills.py`)

**Purpose**: Parse top skills section into list of skill names.

**Function Signature**:

```python
def parse_top_skills_section(raw_text: str) -> List[str]:
    """
    Parse top skills section into list of skill names.

    Returns:
        [
            "Python",
            "Machine Learning",
            "FastAPI",
            ...
        ]
    """
```

**Parsing Strategy**:

1. Normalize text using `normalize_before_h1_text()`
2. Extract lines
3. Each non-empty line is a skill
4. Return list maintaining original order

### 7. Unified Parser API (`src/extraction/api.py`)

**Purpose**: Provide single entry point for parsing complete LinkedIn profiles.

**Function Signature**:

```python
def parse_profile(markdown_text: str) -> Dict[str, Any]:
    """
    Parse complete LinkedIn profile from markdown text.

    Args:
        markdown_text: Raw markdown content from LinkedIn PDF export

    Returns:
        Dictionary with structure:
        {
            "name": str,
            "headline": str,
            "location": str,
            "contact": {...},
            "top_skills": [...],
            "languages": [...],
            "certifications": [...],
            "honors_awards": [...],
            "experience": [...],
            "education": [...],
            "summary": str,
            "raw_sections": {
                "before_h1": {...},
                "after_h1": {...}
            }
        }
    """
```

**Implementation Strategy**:

1. Call `extract_markdown_from_text()` to get base extraction
2. Extract name from `h1` field
3. Extract headline and location from after_h1 lead paragraphs
4. For each before_h1 section, call appropriate parser with try-except:
   - Contact → `parse_contact_section()`
   - Top Skills → `parse_top_skills_section()`
   - Languages → `parse_languages_section()`
   - Certifications → `parse_certifications_section()`
   - Honors-Awards → `parse_honors_awards_section()`
5. For each after_h1 section, call appropriate parser with try-except:
   - Experience → `parse_experience_section()`
   - Education → `parse_education_section()`
   - Summary → extract directly (no parsing needed)
6. Wrap each parser call in try-except to handle errors gracefully
7. Return empty/null values for failed sections
8. Include raw sections for debugging/fallback

**Error Handling**:

```python
def safe_parse(parser_func, text, default):
    """
    Safely execute parser function with error handling.
    Returns default value if parsing fails.
    """
    try:
        return parser_func(text) if text else default
    except Exception as e:
        # Log error (optional)
        return default
```

## Data Models

### Contact Data

```python
{
    "email": Optional[str],
    "phone": Optional[str],
    "<platform_name>": str,  # e.g., "LinkedIn", "GitHub", "Personal"
    ...
}
```

### Language Data

```python
[
    {
        "language": str,
        "proficiency_level": Optional[str]
    },
    ...
]
```

### Simple List Sections (Certifications, Honors-Awards, Top Skills)

```python
[str, str, ...]
```

### Complete Profile Data

```python
{
    "name": str,
    "headline": Optional[str],
    "location": Optional[str],
    "contact": Dict[str, str],
    "top_skills": List[str],
    "languages": List[Dict[str, Optional[str]]],
    "certifications": List[str],
    "honors_awards": List[str],
    "experience": List[Dict],  # Existing format
    "education": List[Dict],   # Existing format
    "summary": Optional[str],
    "raw_sections": {
        "before_h1": Dict[str, str],
        "after_h1": Dict[str, str]
    }
}
```

## Error Handling

### Parser-Level Error Handling

- Each parser function should validate input (non-empty string)
- Return appropriate empty value for invalid input:
  - Contact: `{}`
  - Languages: `[]`
  - Certifications: `[]`
  - Honors-Awards: `[]`
  - Top Skills: `[]`
- Log warnings for malformed data (optional)

### API-Level Error Handling

- Wrap each parser call in try-except
- Continue parsing other sections if one fails
- Include error information in response (optional debug field)
- Never raise exceptions to caller

### Linebreak Handling Pattern (Deterministic)

Based on analysis of actual LinkedIn PDF exports, the pattern is consistent:

- **Double linebreak (`\n\n`)**: Always indicates a new item (skill, certification, contact entry, etc.)
- **Single linebreak (`\n`)**: Always indicates text continuation due to narrow PDF column width

**Edge Cases**:

- URLs split mid-domain: join with single space (will be trimmed)
- Markdown links split across lines: join fragments naturally
- Multiple consecutive single linebreaks: treat as single linebreak
- Empty lines between double linebreaks: normalize to single double linebreak

## Testing Strategy

### Unit Tests

**Test Coverage**:

1. **Text Normalization** (`test_utils.py`):

   - URL fragment joining
   - Text with linebreaks
   - Markdown link handling
   - Paragraph preservation

2. **Contact Parser** (`test_contact.py`):

   - Email extraction
   - Phone extraction
   - Platform label extraction
   - URL with linebreaks
   - Domain-based platform inference
   - Multiple contact methods

3. **Languages Parser** (`test_languages.py`):

   - Language with proficiency
   - Language without proficiency
   - Text with linebreaks
   - Empty section

4. **Certifications Parser** (`test_certifications.py`):

   - Multiple certifications
   - Certification with linebreaks
   - Empty section

5. **Honors-Awards Parser** (`test_honors_awards.py`):

   - Multiple awards
   - Award with linebreaks
   - Empty section

6. **Top Skills Parser** (`test_top_skills.py`):

   - Multiple skills
   - Skill with linebreaks
   - Empty section

7. **Unified API** (`test_api.py`):
   - Complete profile parsing
   - Partial profile (missing sections)
   - Error handling (malformed sections)
   - Empty input

### Integration Tests

**Test with Real Data**:

- Use existing sample files: `YashRathiProfile.md`, `SabestianPdf.md`, `amritansh.md`
- Verify complete profile extraction
- Validate output schema
- Check error resilience

### Test Data Fixtures

- Create minimal test cases for each section
- Include edge cases: empty sections, malformed data, linebreaks
- Use real examples from sample files

## Implementation Notes

### Code Style

- Follow existing codebase conventions (type hints, docstrings)
- Use dataclasses for structured data where appropriate
- Keep functions focused and testable
- Add `__all__` exports to each module

### Dependencies

- No new external dependencies required
- Use standard library: `re`, `typing`, `dataclasses`

### Backward Compatibility

- Existing CLI (`bin/extract_markdown.py`) continues to work
- Existing parser functions remain unchanged
- New unified API is additive, not breaking

### Performance Considerations

- Text normalization is O(n) where n is text length
- Each parser processes its section independently
- No cross-section dependencies
- Suitable for batch processing

### Future Enhancements

- Add confidence scores for parsed data
- Extract dates from certifications/awards
- Validate email/phone formats
- Support additional contact platforms
- Add schema validation for output
