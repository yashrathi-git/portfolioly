"""
Test OpenAI structured outputs with Pydantic models.
"""

import pytest
from app.schemas.extraction import PortfolioExtractionData


def test_pydantic_model_structure():
    """Test that Pydantic model has correct structure for structured outputs."""
    schema = PortfolioExtractionData.model_json_schema()

    # Verify schema has expected structure
    assert "properties" in schema
    assert "personal_info" in schema["properties"]
    assert "work_experiences" in schema["properties"]
    assert "projects" in schema["properties"]
    assert "education" in schema["properties"]
    assert "certifications" in schema["properties"]
    assert "text_blobs" in schema["properties"]

    print("✓ Pydantic model structure is correct")


def test_pydantic_model_validation():
    """Test that Pydantic model can validate data correctly."""
    # Test with minimal valid data
    data = PortfolioExtractionData(
        personal_info=None,
        work_experiences=[],
        projects=[],
        education=[],
        certifications=[],
        text_blobs=None,
    )

    assert data is not None
    assert data.work_experiences == []
    assert data.projects == []

    print("✓ Pydantic model validation works")


if __name__ == "__main__":
    test_pydantic_model_structure()
    test_pydantic_model_validation()
    print("\n✅ All Pydantic model tests passed!")
