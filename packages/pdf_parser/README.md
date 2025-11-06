# LinkedIn Profile Extractor

A Python library for parsing LinkedIn PDF exports into structured JSON data. Designed for integration into larger applications that need consistent, machine-readable profile data.

## Quick Start

```bash
# Install as package
pip install -e .

# Use in Python
from extraction.api import parse_profile

markdown_text = open("profile.md").read()
profile = parse_profile(markdown_text)

print(profile["name"])
print(profile["experience"])
```

See [INTEGRATION_RECOMMENDATIONS.md](INTEGRATION_RECOMMENDATIONS.md) for integration guidance.

## Overview

This module converts LinkedIn profile PDFs (via markdown preprocessing) into structured JSON that preserves semantic information about experience, education, skills, and contact details. It handles complex hierarchies like multi-role company groups and normalizes dates, durations, and locations for downstream processing.

## Installation

### As a Standalone Module

```bash
pip install -r requirements-test.txt
```

### Integration into Parent Application

1. Copy the `src/extraction/` directory into your application's source tree
2. Install dependencies: `pymupdf`, `pytest` (for testing)
3. Import the API: `from extraction.api import parse_profile`

## API Reference

### Primary Function

```python
from extraction.api import parse_profile

def parse_profile(markdown_text: str) -> dict:
    """
    Parse complete LinkedIn profile from markdown text.

    Args:
        markdown_text: Raw markdown content from LinkedIn PDF export

    Returns:
        Dictionary with complete profile structure
    """
```

### Output Schema

```python
{
    "name": str,                          # Full name from H1 heading
    "headline": Optional[str],            # Professional headline
    "location": Optional[str],            # Current location
    "contact": {                          # Contact information
        "email": str,
        "phone": str,
        "LinkedIn": str,
        # ... other contact methods
    },
    "top_skills": List[str],              # Top skills list
    "languages": [                        # Language proficiencies
        {
            "language": str,
            "proficiency_level": Optional[str]
        }
    ],
    "certifications": List[str],          # Certifications list
    "honors_awards": List[str],           # Honors and awards
    "experience": [                       # Work experience
        {
            "type": "standalone_role" | "company_group",
            "company_name": str,
            "title": str,
            "start_date": str,            # ISO format YYYY-MM-DD
            "end_date": Optional[str],    # ISO format or None for current
            "duration_months": int,
            "location": Optional[str],
            "highlights": Optional[str],
            "roles": List[dict]           # Only for company_group type
        }
    ],
    "education": [                        # Education history
        {
            "institution": str,
            "degree": str,
            "start_date": Optional[str],  # ISO format YYYY-MM-DD
            "end_date": Optional[str],
            "duration_months": Optional[int]
        }
    ],
    "summary": Optional[str],             # Profile summary
    "raw_sections": {                     # Raw section text for fallback
        "before_h1": dict,
        "after_h1": dict
    }
}
```

### Usage Example

```python
from pathlib import Path
from extraction.api import parse_profile

# Read markdown file
markdown_text = Path("profile.md").read_text()

# Parse profile
profile = parse_profile(markdown_text)

# Access structured data
print(f"Name: {profile['name']}")
print(f"Email: {profile['contact'].get('email', 'N/A')}")

# Iterate through experience
for exp in profile['experience']:
    print(f"{exp['title']} at {exp['company_name']}")
    print(f"  Duration: {exp['duration_months']} months")

# Iterate through education
for edu in profile['education']:
    print(f"{edu['degree']} from {edu['institution']}")
```

### CLI Tool

```bash
# Parse markdown file and output JSON
python bin/extract_markdown.py path/to/profile.md

# Specify output file
python bin/extract_markdown.py path/to/profile.md -o output.json

# Force overwrite existing file
python bin/extract_markdown.py path/to/profile.md -o output.json --force
```

## Integration Guide

### Integrating into a Parent Application

**Option 1: Copy Source Files**

```bash
# Copy extraction module into your app
cp -r src/extraction your_app/src/

# Update imports in your code
from your_app.extraction.api import parse_profile
```

**Option 2: Install as Package**

```bash
# From the linkedin-extractor directory
pip install -e .

# Then import directly
from extraction.api import parse_profile
```

### Test Integration

**Option 1: Keep Tests Separate**

If your parent application has its own test structure, you can:

- Keep `tests/` in the linkedin-extractor directory
- Run tests independently: `pytest tests/`
- Use as a validation suite before integration

**Option 2: Merge Tests**

If you want unified testing:

```bash
# Copy test fixtures
cp -r tests/fixtures your_app/tests/fixtures/linkedin_profiles/

# Copy or adapt test cases
cp tests/test_profile_parsing.py your_app/tests/test_linkedin_extraction.py

# Update imports in test files
from your_app.extraction.api import parse_profile
```

### Error Handling

The parser uses defensive error handling - individual section failures won't break the entire parse:

```python
profile = parse_profile(markdown_text)

# Check if sections parsed successfully
if not profile['experience']:
    logger.warning("Experience section failed to parse")

# Use raw sections as fallback
if not profile['contact']:
    raw_contact = profile['raw_sections']['before_h1'].get('Contact', '')
    # Custom parsing logic here
```

### Extending the Parser

Add custom section parsers:

```python
from extraction.markdown_extractor import extract_markdown_from_text
from extraction.api import safe_parse

def parse_custom_section(text: str) -> dict:
    """Your custom parser logic"""
    return {"custom_field": "value"}

# Use in your workflow
extraction = extract_markdown_from_text(markdown_text)
custom_data = safe_parse(
    parse_custom_section,
    extraction.after_h1.sections.get("CustomSection"),
    {}
)
```

## Architecture

### Module Structure

```
src/extraction/
├── __init__.py                 # Package exports
├── api.py                      # Main parse_profile() function
├── markdown_extractor.py       # Core markdown splitting logic
└── parsers/                    # Section-specific parsers
    ├── __init__.py
    ├── contact.py              # Contact information
    ├── experience.py           # Work experience (complex)
    ├── education.py            # Education history
    ├── languages.py            # Language proficiencies
    ├── top_skills.py           # Skills list
    ├── certifications.py       # Certifications
    ├── honors_awards.py        # Honors and awards
    └── utils.py                # Shared parsing utilities
```

### Data Flow

1. **Markdown Input** → `extract_markdown_from_text()`
2. **Section Splitting** → Splits on H1, extracts H2/H3 sections
3. **Section Parsing** → Individual parsers process each section
4. **Error Handling** → `safe_parse()` wraps each parser
5. **JSON Output** → Structured dictionary returned

### Key Design Principles

- **Section Isolation**: Each parser operates independently
- **Defensive Parsing**: Failures in one section don't break others
- **Extensibility**: Easy to add new section parsers
- **Deterministic Output**: Same input always produces same output
- **Raw Fallback**: Original text preserved for custom processing

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/test_profile_parsing.py::TestProfileParsing::test_software_engineer_profile

# Using Makefile
make test          # Run tests
make test-cov      # Run with coverage report
make clean         # Clean generated files
```

**Test Coverage**: 84% (15 tests covering all major sections and edge cases)

## Dependencies

- **Runtime**: `pymupdf` (for PDF preprocessing, optional if using markdown directly)
- **Development**: `pytest`, `pytest-cov`

## License

MIT
