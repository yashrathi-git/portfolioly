# Tests

Automated test suite for LinkedIn profile parser.

## Setup

```bash
pip install -r requirements-test.txt
```

## Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_profile_parsing.py

# Run specific test
pytest tests/test_profile_parsing.py::TestProfileParsing::test_software_engineer_profile

# Run with verbose output
pytest -v

# Run and stop on first failure
pytest -x
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py                    # Pytest fixtures
├── test_profile_parsing.py        # Integration tests
└── fixtures/                      # Test data
    ├── profile_001_software_engineer.md
    ├── profile_002_researcher.md
    └── profile_003_analyst.md
```

## Test Coverage

- Profile parsing (complete workflow)
- Section coverage (all major sections)
- Experience parsing (standalone roles, company groups, dates)
- Education parsing (degrees, institutions)
- Contact parsing (multiple methods)
- Language parsing (proficiency levels)
- Optional sections handling

## Test Data

All test data uses fictional profiles with anonymized information.
