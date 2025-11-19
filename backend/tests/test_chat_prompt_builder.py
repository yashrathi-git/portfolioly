"""
Tests for chat prompt builder service.
"""

import pytest
from app.services.chat_prompt_builder import build_system_prompt
from app.schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    WorkExperience,
    DateInfo,
)


class TestSystemPromptBuilder:
    """Test complete system prompt building."""

    def test_build_complete_prompt(self):
        """Should build complete prompt with all sections."""
        portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                headline="Software Engineer",
                summary="I am passionate about building great software.",
                email="john@example.com",
            ),
            work_experiences=[
                WorkExperience(
                    title="Senior Engineer",
                    organization="Tech Corp",
                    technologies=["React", "Python"],
                    start_date=DateInfo(year=2020, month=1),
                    is_current=True,
                )
            ],
        )

        result = build_system_prompt(portfolio)

        # Check key sections are present
        assert "<role>" in result
        assert "<personality>" in result
        assert "<knowledge_base>" in result
        assert "<widget_system>" in result
        assert "<conversation_flow>" in result
        assert "<response_patterns>" in result
        assert "<core_rules>" in result

        # Check name is used
        assert "John Doe" in result

        # Check portfolio context is included
        assert "Personal Information" in result
        assert "Work Experience" in result

    def test_prompt_includes_portfolio_data(self):
        """Should include portfolio data in knowledge base for LLM to analyze."""
        portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="Jane Smith",
                headline="Data Scientist",
                summary="I am passionate about machine learning and solving complex problems.",
            )
        )

        result = build_system_prompt(portfolio)

        # Should contain the portfolio data in knowledge base
        assert "machine learning" in result.lower()
        assert "Jane Smith" in result
        assert "Data Scientist" in result
        # LLM should analyze this data itself
        assert "Analyze the knowledge base yourself" in result
