# Integration Guide

This document explains how to integrate `linkedin-extractor` into a larger application.

## Quick Start

### Option 1: Install as Package (Recommended)

```bash
# From the linkedin-extractor directory
pip install -e .

# Or install from git
pip install git+https://github.com/yourusername/linkedin-extractor.git
```

Then import in your application:

```python
from extraction.api import parse_profile

markdown_text = load_profile_markdown()  # Your loading logic
profile = parse_profile(markdown_text)
```

### Option 2: Copy Source Files

```bash
# Copy the extraction module into your app
cp -r linkedin-extractor/src/extraction your_app/src/

# Update imports
from your_app.extraction.api import parse_profile
```

## Test Integration

### Keep Tests Separate (Recommended for Libraries)

Run tests independently to validate the module:

```bash
cd linkedin-extractor
pytest tests/ -v
```

This approach is best when:

- You want to validate the module independently
- Your parent app has a different test structure
- You're treating this as a vendored dependency

### Merge Tests (Recommended for Monorepos)

Integrate tests into your parent application:

```bash
# Copy test fixtures
mkdir -p your_app/tests/fixtures/linkedin
cp -r linkedin-extractor/tests/fixtures/* your_app/tests/fixtures/linkedin/

# Copy test file
cp linkedin-extractor/tests/test_profile_parsing.py your_app/tests/test_linkedin_extraction.py

# Update imports in test file
# Change: from extraction.api import parse_profile
# To: from your_app.extraction.api import parse_profile
```

Update your parent app's `pytest.ini` or `pyproject.toml`:

```ini
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

## Directory Structure After Integration

### As Installed Package

```
your_app/
├── src/
│   └── your_app/
│       ├── __init__.py
│       └── services/
│           └── profile_service.py  # Uses: from extraction.api import parse_profile
├── tests/
│   └── test_profile_service.py
└── requirements.txt                # Add: linkedin-extractor
```

### As Copied Module

```
your_app/
├── src/
│   └── your_app/
│       ├── __init__.py
│       ├── extraction/             # Copied from linkedin-extractor/src/extraction/
│       │   ├── __init__.py
│       │   ├── api.py
│       │   ├── markdown_extractor.py
│       │   └── parsers/
│       └── services/
│           └── profile_service.py  # Uses: from your_app.extraction.api import parse_profile
├── tests/
│   ├── fixtures/
│   │   └── linkedin/               # Copied from linkedin-extractor/tests/fixtures/
│   └── test_linkedin_extraction.py # Adapted from linkedin-extractor/tests/
└── requirements.txt                # Add: pymupdf
```

## Usage Patterns

### Basic Integration

```python
from extraction.api import parse_profile
from pathlib import Path

def load_linkedin_profile(file_path: str) -> dict:
    """Load and parse LinkedIn profile."""
    markdown_text = Path(file_path).read_text()
    return parse_profile(markdown_text)

# Use in your application
profile = load_linkedin_profile("uploads/profile.md")
save_to_database(profile)
```

### With Error Handling

```python
from extraction.api import parse_profile
import logging

logger = logging.getLogger(__name__)

def safe_parse_profile(markdown_text: str) -> dict | None:
    """Parse profile with comprehensive error handling."""
    try:
        profile = parse_profile(markdown_text)

        # Validate required fields
        if not profile.get('name'):
            logger.error("Profile missing required 'name' field")
            return None

        return profile

    except Exception as e:
        logger.exception(f"Failed to parse profile: {e}")
        return None
```

### Async Integration

```python
from extraction.api import parse_profile
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parse_profile_async(markdown_text: str) -> dict:
    """Parse profile asynchronously."""
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        profile = await loop.run_in_executor(
            executor,
            parse_profile,
            markdown_text
        )
    return profile

# Use in async context
profile = await parse_profile_async(markdown_text)
```

### Batch Processing

```python
from extraction.api import parse_profile
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import json

def process_profile_file(file_path: Path) -> dict:
    """Process single profile file."""
    markdown_text = file_path.read_text()
    profile = parse_profile(markdown_text)
    profile['source_file'] = str(file_path)
    return profile

def batch_process_profiles(input_dir: Path, output_dir: Path):
    """Process multiple profiles in parallel."""
    markdown_files = list(input_dir.glob("*.md"))

    with ProcessPoolExecutor() as executor:
        profiles = executor.map(process_profile_file, markdown_files)

    # Save results
    for profile in profiles:
        output_file = output_dir / f"{profile['name']}.json"
        output_file.write_text(json.dumps(profile, indent=2))

# Usage
batch_process_profiles(Path("uploads"), Path("processed"))
```

## Extending the Parser

### Add Custom Section Parser

```python
# your_app/extraction/parsers/custom_section.py
def parse_custom_section(text: str) -> dict:
    """Parse your custom section."""
    lines = text.strip().split('\n')
    return {
        'field1': lines[0] if lines else None,
        'field2': lines[1] if len(lines) > 1 else None,
    }

# Integrate into parsing workflow
from extraction.markdown_extractor import extract_markdown_from_text
from extraction.api import safe_parse, parse_profile
from your_app.extraction.parsers.custom_section import parse_custom_section

def parse_profile_extended(markdown_text: str) -> dict:
    """Parse profile with custom sections."""
    # Get base profile
    profile = parse_profile(markdown_text)

    # Parse custom section
    extraction = extract_markdown_from_text(markdown_text)
    custom_data = safe_parse(
        parse_custom_section,
        extraction.after_h1.sections.get("CustomSection"),
        {}
    )

    profile['custom_section'] = custom_data
    return profile
```

### Override Existing Parser

```python
from extraction.api import parse_profile as base_parse_profile
from extraction.markdown_extractor import extract_markdown_from_text
from extraction.api import safe_parse

def custom_experience_parser(text: str) -> list:
    """Your custom experience parsing logic."""
    # Custom implementation
    return []

def parse_profile(markdown_text: str) -> dict:
    """Parse profile with custom experience parser."""
    # Get base extraction
    extraction = extract_markdown_from_text(markdown_text)

    # Use base parser for most sections
    profile = base_parse_profile(markdown_text)

    # Override experience with custom parser
    profile['experience'] = safe_parse(
        custom_experience_parser,
        extraction.after_h1.sections.get("Experience"),
        []
    )

    return profile
```

## Dependencies

Add to your `requirements.txt`:

```txt
# If installing as package
linkedin-extractor>=0.1.0

# If copying source files
pymupdf>=1.23.0
```

For development/testing:

```txt
pytest>=7.0.0
pytest-cov>=4.0.0
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test LinkedIn Extractor

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install -e .
          pip install pytest pytest-cov

      - name: Run tests
        run: pytest tests/ --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Import Errors

If you get `ModuleNotFoundError: No module named 'extraction'`:

1. Ensure package is installed: `pip install -e .`
2. Check PYTHONPATH includes the src directory
3. Verify package structure has `__init__.py` files

### Test Discovery Issues

If pytest doesn't find tests:

1. Check `pytest.ini` configuration
2. Ensure test files start with `test_`
3. Verify test classes start with `Test`
4. Run with `-v` flag for verbose output

### Parser Failures

If specific sections fail to parse:

1. Check `profile['raw_sections']` for original text
2. Enable logging to see parser errors
3. Use `safe_parse()` wrapper for custom parsers
4. Validate input markdown format matches expected structure

## Support

For issues specific to the linkedin-extractor module, check:

- README.md for API documentation
- tests/ for usage examples
- src/extraction/parsers/ for parser implementations
