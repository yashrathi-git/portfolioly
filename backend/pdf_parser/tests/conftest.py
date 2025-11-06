"""Pytest configuration and fixtures."""

import pytest
from pathlib import Path


@pytest.fixture
def test_data_dir():
    """Return path to test data directory."""
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def profile_001(test_data_dir):
    """Load software engineer profile."""
    return (test_data_dir / "profile_001_software_engineer.md").read_text(
        encoding="utf-8"
    )


@pytest.fixture
def profile_002(test_data_dir):
    """Load researcher profile."""
    return (test_data_dir / "profile_002_researcher.md").read_text(encoding="utf-8")


@pytest.fixture
def profile_003(test_data_dir):
    """Load analyst profile."""
    return (test_data_dir / "profile_003_analyst.md").read_text(encoding="utf-8")
