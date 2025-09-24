"""
Unit tests for AIProcessor.

Tests the core functionality of AI-powered portfolio data extraction
with cost controls and text truncation.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock

from app.services.ai_processor import (
    AIProcessor,
    AIProcessingError,
    TokenLimitExceededError,
    get_ai_processor,
)
from app.schemas.portfolio import PortfolioData, PersonalInfo
from app.schemas.upload import PDFData, GitHubRepoData


class TestAIProcessor:
    """Test AIProcessor functionality."""

    @pytest.fixture
    def mock_tiktoken(self):
        """Mock tiktoken encoder."""
        with patch("app.services.ai_processor.tiktoken") as mock_tiktoken:
            mock_encoder = Mock()
            mock_encoder.encode.return_value = [1, 2, 3, 4, 5]  # 5 tokens
            mock_tiktoken.get_encoding.return_value = mock_encoder
            yield mock_encoder

    @pytest.fixture
    def mock_azure_client(self):
        """Mock Azure AI client."""
        with patch(
            "app.services.ai_processor.ChatCompletionsClient"
        ) as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            yield mock_client

    @pytest.fixture
    def ai_processor(self, mock_tiktoken, mock_azure_client):
        """Create AIProcessor instance with mocked dependencies."""
        processor = AIProcessor(
            endpoint="https://test.endpoint.com", api_key="test-key", max_tokens=1000
        )
        return processor

    @pytest.fixture
    def sample_pdf_data(self):
        """Sample PDF data for testing."""
        return PDFData(
            text="John Doe\nSoftware Engineer\nExperience: Python, React\nEducation: BS Computer Science",
            source="resume",
            filename="resume.pdf",
            pages=1,
            size=1024,
            checksum="abc123",
            processed_at="2023-01-01T00:00:00Z",
            blob_url=None,
        )

    @pytest.fixture
    def sample_github_data(self):
        """Sample GitHub data for testing."""
        return [
            GitHubRepoData(
                id=1,
                name="awesome-project",
                description="A great Python project",
                url="https://github.com/user/awesome-project",
                language="Python",
                stars=100,
                fork=False,
                private=False,
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            )
        ]

    def test_initialization_with_credentials(self, mock_tiktoken, mock_azure_client):
        """Test AIProcessor initialization with credentials."""
        processor = AIProcessor(
            endpoint="https://test.endpoint.com", api_key="test-key"
        )

        assert processor.endpoint == "https://test.endpoint.com"
        assert processor.api_key == "test-key"
        assert processor.max_tokens == AIProcessor.MAX_TOKENS_PER_REQUEST
        assert processor.client is not None

    def test_initialization_without_credentials(self, mock_tiktoken):
        """Test AIProcessor initialization without credentials."""
        with patch("app.services.ai_processor.settings") as mock_settings:
            mock_settings.azure_ai_endpoint = None
            mock_settings.azure_ai_api_key = None

            processor = AIProcessor()

            assert processor.client is None

    def test_count_tokens_with_encoder(self, ai_processor):
        """Test token counting with tiktoken encoder."""
        result = ai_processor.count_tokens("test text")

        assert result == 5  # Mock encoder returns 5 tokens
        ai_processor.encoder.encode.assert_called_once_with("test text")

    def test_count_tokens_fallback(self, mock_azure_client):
        """Test token counting fallback when encoder fails."""
        with patch("app.services.ai_processor.tiktoken") as mock_tiktoken:
            mock_tiktoken.get_encoding.side_effect = Exception("Encoder failed")

            processor = AIProcessor(
                endpoint="https://test.endpoint.com", api_key="test-key"
            )

            result = processor.count_tokens("test")  # 4 characters = 1 token
            assert result == 1

    def test_format_github_data(self, ai_processor, sample_github_data):
        """Test GitHub data formatting."""
        result = ai_processor._format_github_data(sample_github_data)

        assert "awesome-project" in result
        assert "A great Python project" in result
        assert "Python" in result
        assert "100" in result

    def test_format_github_data_empty(self, ai_processor):
        """Test GitHub data formatting with empty list."""
        result = ai_processor._format_github_data([])

        assert "No GitHub repositories provided" in result

    def test_truncate_to_tokens(self, ai_processor):
        """Test text truncation to token limit."""
        # Mock count_tokens to return word count for simplicity
        ai_processor.count_tokens = lambda x: len(x.split())

        text = "one two three four five six seven eight nine ten"
        result = ai_processor._truncate_to_tokens(text, 5)  # Limit to 5 tokens

        words = result.replace("...", "").split()
        assert len(words) <= 5

    def test_truncate_text_intelligently(
        self, ai_processor, sample_pdf_data, sample_github_data
    ):
        """Test intelligent text truncation."""
        # Mock count_tokens to return manageable numbers
        ai_processor.count_tokens = lambda x: len(x) // 10  # 10 chars = 1 token
        ai_processor.max_tokens = 50  # Small limit for testing

        result = ai_processor.truncate_text_intelligently(
            resume_text=sample_pdf_data.text, github_data=sample_github_data
        )

        assert "GitHub Repositories" in result
        assert len(result) > 0

    def test_validate_response_success(self, ai_processor):
        """Test successful response validation."""
        response_content = json.dumps(
            {
                "personal_info": {"full_name": "John Doe"},
                "work_experiences": [],
                "projects": [],
                "education": [],
                "certifications": [],
                "text_blobs": {},
                "metadata": {"source_type": "resume_pdf"},
            }
        )

        result = ai_processor.validate_response(response_content)

        assert isinstance(result, PortfolioData)
        assert result.personal_info.full_name == "John Doe"

    def test_validate_response_invalid_json(self, ai_processor):
        """Test response validation with invalid JSON."""
        response_content = "invalid json"

        with pytest.raises(AIProcessingError, match="Invalid JSON response"):
            ai_processor.validate_response(response_content)

    def test_validate_portfolio_data_good(self, ai_processor):
        """Test portfolio data validation with good data."""
        portfolio_data = PortfolioData(
            personal_info=PersonalInfo(full_name="John Doe", email="john@example.com")
        )

        result = ai_processor.validate_portfolio_data(portfolio_data)

        assert result is True

    def test_validate_portfolio_data_empty(self, ai_processor):
        """Test portfolio data validation with empty data."""
        portfolio_data = PortfolioData()

        result = ai_processor.validate_portfolio_data(portfolio_data)

        assert result is False

    @patch("app.services.ai_processor.JsonSchemaFormat")
    def test_process_portfolio_data_success(
        self, mock_response_format, ai_processor, sample_pdf_data
    ):
        """Test successful portfolio data processing."""
        # Mock Azure AI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps(
            {
                "personal_info": {"full_name": "John Doe"},
                "work_experiences": [],
                "projects": [],
                "education": [],
                "certifications": [],
                "text_blobs": {},
                "metadata": {"source_type": "resume_pdf"},
            }
        )

        ai_processor.client.complete.return_value = mock_response

        # Mock token counting to be within limits
        ai_processor.count_tokens = lambda x: 100

        result = ai_processor.process_portfolio_data(resume_pdf=sample_pdf_data)

        assert isinstance(result, PortfolioData)
        assert result.personal_info.full_name == "John Doe"

    def test_process_portfolio_data_token_limit_exceeded(
        self, ai_processor, sample_pdf_data
    ):
        """Test processing with token limit exceeded."""
        # Mock token counting to exceed limits
        ai_processor.count_tokens = lambda x: ai_processor.max_tokens + 1

        with pytest.raises(AIProcessingError, match="Input still exceeds token limit"):
            ai_processor.process_portfolio_data(resume_pdf=sample_pdf_data)

    def test_get_ai_processor_singleton(self):
        """Test that get_ai_processor returns the same instance."""
        with patch("app.services.ai_processor.AIProcessor") as mock_processor_class:
            mock_instance = Mock()
            mock_processor_class.return_value = mock_instance

            # Clear the global instance
            import app.services.ai_processor

            app.services.ai_processor._ai_processor = None

            # Get processor twice
            processor1 = get_ai_processor()
            processor2 = get_ai_processor()

            # Should be the same instance
            assert processor1 is processor2
            # Should only create once
            mock_processor_class.assert_called_once()


class TestTextTruncation:
    """Test specific text truncation scenarios."""

    def test_truncation_preserves_structure(self):
        """Test that truncation preserves document structure."""
        processor = AIProcessor()
        processor.count_tokens = lambda x: len(x.split())  # Simple word count
        processor.max_tokens = 20

        resume_text = "EXPERIENCE\nSoftware Engineer at Google\nBuilt systems\nEDUCATION\nBS Computer Science"

        result = processor.truncate_text_intelligently(resume_text=resume_text)

        # Should preserve section headers
        assert "##" in result  # Section markers
        assert len(result.split()) <= 25  # Roughly within limits

    def test_prioritization_resume_over_linkedin(self):
        """Test that resume content is prioritized over LinkedIn."""
        processor = AIProcessor()
        processor.count_tokens = lambda x: len(x.split())
        processor.max_tokens = 10  # Very small limit

        resume_text = "RESUME: Important work experience at Google"
        linkedin_text = "LINKEDIN: Some additional profile information"

        result = processor.truncate_text_intelligently(
            resume_text=resume_text, linkedin_text=linkedin_text
        )

        # Resume content should be included
        assert "RESUME" in result or "Google" in result
        # LinkedIn might be truncated out
        assert len(result.split()) <= 15  # Roughly within limits
