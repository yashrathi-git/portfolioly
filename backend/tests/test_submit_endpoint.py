"""
Unit tests for the updated submit endpoint with AI processing.

Tests the core functionality of the submit endpoint including
AI processing, rate limiting, and error handling.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime

from app.main import app
from app.schemas.upload import UploadSubmissionRequest, PDFData, GitHubRepoData
from app.schemas.portfolio import PortfolioData, PersonalInfo
from app.auth.middleware import require_verified_email
from app.schemas.auth import UserToken


class TestSubmitEndpoint:
    """Test the submit endpoint functionality."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_user_token(self):
        """Mock user token for authentication."""
        return {
            "uid": "test_user_123",
            "email": "test@example.com",
            "email_verified": True,
        }

    @pytest.fixture(autouse=True)
    def override_require_verified_email(self):
        """Override authentication dependency with a verified user."""

        async def _mock_user():
            return UserToken(
                uid="test_user_123",
                email="test@example.com",
                email_verified=True,
            )

        app.dependency_overrides[require_verified_email] = _mock_user
        yield
        app.dependency_overrides.pop(require_verified_email, None)

    @pytest.fixture
    def sample_request_github_only(self):
        """Sample request with only GitHub data."""
        return {
            "linkedin_pdf": None,
            "resume_pdf": None,
            "github_repos": [
                {
                    "id": 1,
                    "name": "test-repo",
                    "description": "A test repository",
                    "stars": 10,
                    "url": "https://github.com/user/test-repo",
                    "language": "Python",
                    "fork": False,
                    "private": False,
                    "created_at": "2023-01-01T00:00:00Z",
                    "updated_at": "2023-12-01T00:00:00Z",
                }
            ],
        }

    @pytest.fixture
    def sample_request_with_pdf(self):
        """Sample request with PDF data."""
        return {
            "linkedin_pdf": None,
            "resume_pdf": {
                "text": "John Doe\nSoftware Engineer\nPython, React",
                "source": "resume",
                "filename": "resume.pdf",
                "pages": 1,
                "size": 1024,
                "checksum": "abc123",
                "processed_at": "2023-01-01T00:00:00Z",
            },
            "github_repos": [],
        }

    @patch("app.routes.upload.get_portfolio_service")
    def test_submit_github_only_success(
        self,
        mock_portfolio_service,
        client,
        mock_user_token,
        sample_request_github_only,
    ):
        """Test successful submission with GitHub-only data."""
        # Mock authentication
        # Mock portfolio service
        mock_service = Mock()
        mock_service.map_github_only_data.return_value = PortfolioData(
            personal_info=PersonalInfo(full_name="Test User")
        )
        mock_service.store_portfolio_data.return_value = True
        mock_portfolio_service.return_value = mock_service

        # Make request
        response = client.post("/api/submit", json=sample_request_github_only)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["processing_type"] == "github_only"
        assert data["data"]["github_repos_count"] == 1

    @patch("app.routes.upload.get_portfolio_service")
    @patch("app.routes.upload.get_ai_processor")
    @patch("app.routes.upload.get_ai_rate_limiter")
    def test_submit_with_ai_processing_success(
        self,
        mock_rate_limiter,
        mock_ai_processor,
        mock_portfolio_service,
        client,
        mock_user_token,
        sample_request_with_pdf,
    ):
        """Test successful submission with AI processing."""
        # Mock authentication
        # Mock rate limiter
        mock_limiter = Mock()
        mock_limiter.check_rate_limit.return_value = {
            "current_usage": 5,
            "monthly_limit": 10,
            "remaining": 5,
            "limit_exceeded": False,
        }
        mock_limiter.increment_usage.return_value = True
        mock_rate_limiter.return_value = mock_limiter

        # Mock AI processor
        mock_processor = Mock()
        mock_processor.process_portfolio_data = AsyncMock(
            return_value=PortfolioData(personal_info=PersonalInfo(full_name="John Doe"))
        )
        mock_ai_processor.return_value = mock_processor

        # Mock portfolio service
        mock_service = Mock()
        mock_service.store_portfolio_data.return_value = True
        mock_portfolio_service.return_value = mock_service

        # Make request
        response = client.post("/api/submit", json=sample_request_with_pdf)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["processing_type"] == "ai_extraction"
        assert "AI extraction" in data["message"]

    @patch("app.routes.upload.get_ai_rate_limiter")
    def test_submit_rate_limit_exceeded(
        self, mock_rate_limiter, client, sample_request_with_pdf
    ):
        """Test submission when rate limit is exceeded."""
        # Mock authentication
        # Mock rate limiter to raise exception
        from app.services.ai_rate_limiter import AIRateLimitError

        mock_limiter = Mock()
        mock_limiter.check_rate_limit.side_effect = AIRateLimitError(
            "Monthly limit exceeded"
        )
        mock_rate_limiter.return_value = mock_limiter

        # Make request
        response = client.post("/api/submit", json=sample_request_with_pdf)

        # Assertions
        assert response.status_code == 500

    @patch("app.routes.upload.get_portfolio_service")
    @patch("app.routes.upload.get_ai_processor")
    @patch("app.routes.upload.get_ai_rate_limiter")
    def test_submit_ai_processing_failure(
        self,
        mock_rate_limiter,
        mock_ai_processor,
        mock_portfolio_service,
        client,
        sample_request_with_pdf,
    ):
        """Test submission when AI processing fails."""
        # Mock authentication
        # Mock rate limiter
        mock_limiter = Mock()
        mock_limiter.check_rate_limit.return_value = {"limit_exceeded": False}
        mock_rate_limiter.return_value = mock_limiter

        # Mock AI processor to raise exception
        from app.services.ai_processor import AIProcessingError

        mock_processor = Mock()
        mock_processor.process_portfolio_data = AsyncMock(
            side_effect=AIProcessingError("AI processing failed")
        )
        mock_ai_processor.return_value = mock_processor

        # Make request
        response = client.post("/api/submit", json=sample_request_with_pdf)

        # Assertions
        assert response.status_code == 200  # Still success, but with placeholder
        data = response.json()
        assert data["success"] is False
        assert data["data"]["processing_type"] == "placeholder"
        assert data["data"]["ai_processing_failed"] is True

    def test_submit_no_data(self, client):
        """Test submission with no data."""
        empty_request = {"linkedin_pdf": None, "resume_pdf": None, "github_repos": []}

        response = client.post("/api/submit", json=empty_request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["processing_type"] == "no_data"
