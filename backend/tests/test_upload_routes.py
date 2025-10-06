"""
Integration tests for upload API routes.
"""

import pytest
import io
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import UploadFile

from app.main import app
from app.schemas.pdf import PDFParseResult, PDFMetadata
from app.schemas.github import PaginatedRepoResponse, GitHubRepo
from datetime import datetime


class TestPDFUploadEndpoint:
    """Test cases for PDF upload endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def mock_auth_headers(self):
        """Mock authentication headers."""
        return {"Authorization": "Bearer mock_token"}

    @pytest.fixture
    def mock_pdf_file(self):
        """Mock PDF file for upload."""
        pdf_content = b"%PDF-1.4\nSample PDF content"
        return ("test.pdf", io.BytesIO(pdf_content), "application/pdf")

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_pdf_upload_rate_limit")
    @patch("app.routes.upload.get_azure_blob_storage_service")
    @patch("app.routes.upload.get_pdf_processor")
    def test_upload_pdf_success(
        self,
        mock_get_processor,
        mock_get_azure_service,
        mock_rate_limit,
        mock_auth,
        client,
        mock_auth_headers,
        mock_pdf_file,
    ):
        """Test successful PDF upload."""
        # Mock authentication
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_user.email = "test@example.com"
        mock_user.email_verified = True
        mock_auth.return_value = mock_user

        # Mock rate limiting
        mock_rate_limit.return_value = None

        # Mock PDF processor
        mock_processor = Mock()
        mock_processor.validate_source.return_value = True

        mock_metadata = PDFMetadata(
            source="linkedin",
            pages=2,
            filename="test.pdf",
            size=1024,
            checksum="abc123",
            processed_at=datetime.utcnow(),
        )

        mock_result = PDFParseResult(
            text="Sample extracted text", metadata=mock_metadata, success=True
        )

        mock_processor.parse_pdf = AsyncMock(return_value=mock_result)
        mock_get_processor.return_value = mock_processor

        mock_storage_service = AsyncMock()
        mock_storage_service.upload_user_pdf.return_value = "https://example.blob/pdf"
        mock_get_azure_service.return_value = mock_storage_service

        # Make request
        response = client.post(
            "/api/ingest/pdf?source=linkedin",
            files={"file": mock_pdf_file},
            headers=mock_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["text"] == "Sample extracted text"
        assert data["meta"]["source"] == "linkedin"
        assert data["meta"]["pages"] == 2
        assert data["user_id"] == "test_user_123"

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_pdf_upload_rate_limit")
    def test_upload_pdf_invalid_source(
        self, mock_rate_limit, mock_auth, client, mock_auth_headers, mock_pdf_file
    ):
        """Test PDF upload with invalid source."""
        # Mock authentication
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user
        mock_rate_limit.return_value = None

        response = client.post(
            "/api/ingest/pdf?source=invalid",
            files={"file": mock_pdf_file},
            headers=mock_auth_headers,
        )

        assert response.status_code == 400
        data = response.json()
        assert "INVALID_SOURCE" in str(data["detail"])

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_pdf_upload_rate_limit")
    def test_upload_pdf_invalid_file_type(
        self, mock_rate_limit, mock_auth, client, mock_auth_headers
    ):
        """Test PDF upload with invalid file type."""
        # Mock authentication
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user
        mock_rate_limit.return_value = None

        # Create non-PDF file
        text_file = ("test.txt", io.BytesIO(b"Not a PDF"), "text/plain")

        response = client.post(
            "/api/ingest/pdf?source=linkedin",
            files={"file": text_file},
            headers=mock_auth_headers,
        )

        assert response.status_code == 415
        data = response.json()
        assert "INVALID_FILE_TYPE" in str(data["detail"])

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_pdf_upload_rate_limit")
    @patch("app.routes.upload.get_azure_blob_storage_service")
    @patch("app.routes.upload.get_pdf_processor")
    def test_upload_pdf_processing_failure(
        self,
        mock_get_processor,
        mock_get_azure_service,
        mock_rate_limit,
        mock_auth,
        client,
        mock_auth_headers,
        mock_pdf_file,
    ):
        """Test PDF upload with processing failure."""
        # Mock authentication
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user
        mock_rate_limit.return_value = None

        # Mock PDF processor with failure
        mock_processor = Mock()
        mock_processor.validate_source.return_value = True

        mock_result = PDFParseResult(
            text="",
            metadata=PDFMetadata(
                source="linkedin",
                pages=0,
                filename="test.pdf",
                size=0,
                checksum="",
                processed_at=datetime.utcnow(),
            ),
            success=False,
            error_message="PDF processing failed",
        )

        mock_processor.parse_pdf = AsyncMock(return_value=mock_result)
        mock_get_processor.return_value = mock_processor

        mock_storage_service = AsyncMock()
        mock_storage_service.upload_user_pdf.return_value = None
        mock_get_azure_service.return_value = mock_storage_service

        response = client.post(
            "/api/ingest/pdf?source=linkedin",
            files={"file": mock_pdf_file},
            headers=mock_auth_headers,
        )

        assert response.status_code == 422
        data = response.json()
        assert "PDF_PROCESSING_FAILED" in str(data["detail"])


class TestGitHubReposEndpoint:
    """Test cases for GitHub repositories endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def mock_auth_headers(self):
        return {"Authorization": "Bearer mock_token"}

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_github_api_rate_limit")
    @patch("app.routes.upload.get_github_service")
    def test_get_github_repos_success(
        self, mock_get_service, mock_rate_limit, mock_auth, client, mock_auth_headers
    ):
        """Test successful GitHub repositories fetch."""
        # Mock authentication
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user
        mock_rate_limit.return_value = None

        # Mock GitHub service
        mock_repo = GitHubRepo(
            id=123,
            name="test-repo",
            description="Test repository",
            stargazers_count=42,
            html_url="https://github.com/user/test-repo",
            language="Python",
            fork=False,
            private=False,
            created_at=datetime(2023, 1, 1),
            updated_at=datetime(2023, 12, 1),
        )

        mock_response = PaginatedRepoResponse(
            repos=[mock_repo], total_count=1, page=1, per_page=20, has_next=False
        )

        mock_service = Mock()
        mock_service.fetch_user_repos = AsyncMock(return_value=mock_response)
        mock_get_service.return_value = mock_service

        response = client.get(
            "/api/github/repos?username=testuser&page=1&per_page=20",
            headers=mock_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["repos"]) == 1
        assert data["repos"][0]["name"] == "test-repo"
        assert data["total_count"] == 1
        assert data["has_next"] is False

    @patch("app.routes.upload.require_verified_email")
    @patch("app.routes.upload.check_github_api_rate_limit")
    def test_get_github_repos_missing_username(
        self, mock_rate_limit, mock_auth, client, mock_auth_headers
    ):
        """Test GitHub repos endpoint without username."""
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user
        mock_rate_limit.return_value = None

        response = client.get("/api/github/repos", headers=mock_auth_headers)

        assert response.status_code == 422  # Validation error


# Note: GitHub import endpoint has been removed and replaced with
# a unified upload submission endpoint (/api/submit).
# Import-specific tests are no longer needed.


class TestConfigEndpoint:
    """Test cases for configuration endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def mock_auth_headers(self):
        return {"Authorization": "Bearer mock_token"}

    @patch("app.api.upload_routes.require_verified_email")
    def test_get_upload_config(self, mock_auth, client, mock_auth_headers):
        """Test upload configuration endpoint."""
        mock_user = Mock()
        mock_user.uid = "test_user_123"
        mock_auth.return_value = mock_user

        response = client.get("/api/upload/config", headers=mock_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "max_file_size_mb" in data
        assert "allowed_file_types" in data
        assert "max_github_repos" in data
        assert "rate_limits" in data
        assert isinstance(data["max_file_size_mb"], int)
        assert isinstance(data["allowed_file_types"], list)


class TestHealthEndpoint:
    """Test cases for health check endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_upload_health_check(self, client):
        """Test upload health check endpoint."""
        response = client.get("/api/upload/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
