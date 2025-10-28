"""
Unit tests for PortfolioService.

Tests the core functionality of portfolio data persistence and GitHub mapping.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from app.services.portfolio_service import (
    PortfolioService,
    FirebaseError,
    get_portfolio_service,
)
from app.schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    Project,
    PortfolioMetadata,
)
from app.schemas.upload import GitHubRepoData


class TestPortfolioService:
    """Test PortfolioService functionality."""

    @pytest.fixture
    def mock_firestore(self):
        """Mock Firestore client."""
        with patch("app.services.portfolio_service.firestore") as mock_firestore:
            mock_db = Mock()
            mock_firestore.client.return_value = mock_db
            yield mock_db

    @pytest.fixture
    def mock_firebase_admin(self):
        """Mock Firebase Admin SDK."""
        with patch("app.services.portfolio_service.firebase_admin") as mock_admin:
            # Mock that Firebase is not initialized
            mock_admin.get_app.side_effect = ValueError("No app")
            mock_admin.initialize_app.return_value = None
            yield mock_admin

    @pytest.fixture
    def portfolio_service(self, mock_firestore, mock_firebase_admin):
        """Create PortfolioService instance with mocked dependencies."""
        service = PortfolioService()
        service._db = mock_firestore
        return service

    @pytest.fixture
    def sample_portfolio_data(self):
        """Sample portfolio data for testing."""
        return PortfolioData(
            personal_info=PersonalInfo(full_name="John Doe", email="john@example.com"),
            projects=[Project(name="Test Project", technologies=["Python", "FastAPI"])],
            metadata=PortfolioMetadata(source_type="resume_pdf", notes="Test data"),
        )

    @pytest.fixture
    def sample_github_repos(self):
        """Sample GitHub repository data for testing."""
        return [
            GitHubRepoData(
                id=1,
                name="awesome-project",
                description="An awesome Python project",
                url="https://github.com/user/awesome-project",
                language="Python",
                stars=150,
                fork=False,
                private=False,
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            ),
            GitHubRepoData(
                id=2,
                name="react-app",
                description="A React application",
                url="https://github.com/user/react-app",
                language="JavaScript",
                stars=75,
                fork=False,
                private=False,
                created_at="2023-06-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            ),
        ]

    def test_store_portfolio_data_success(
        self, portfolio_service, mock_firestore, sample_portfolio_data
    ):
        """Test successful portfolio data storage."""
        # Mock Firestore operations
        mock_doc_ref = Mock()
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test storage
        result = portfolio_service.store_portfolio_data(
            "user123", sample_portfolio_data
        )

        # Assertions
        assert result is True
        mock_firestore.collection.assert_called_once_with("portfolios")
        mock_firestore.collection.return_value.document.assert_called_once_with(
            "user123"
        )
        mock_doc_ref.set.assert_called_once()

        # Check that the data passed to set() includes updated_at
        call_args = mock_doc_ref.set.call_args[0][0]
        assert "updated_at" in call_args
        assert "personal_info" in call_args

    def test_store_portfolio_data_failure(
        self, portfolio_service, mock_firestore, sample_portfolio_data
    ):
        """Test portfolio data storage failure."""
        # Mock Firestore to raise exception
        mock_firestore.collection.side_effect = Exception("Firestore error")

        # Test storage failure
        with pytest.raises(FirebaseError, match="Failed to store portfolio data"):
            portfolio_service.store_portfolio_data("user123", sample_portfolio_data)

    def test_get_portfolio_data_success(self, portfolio_service, mock_firestore):
        """Test successful portfolio data retrieval."""
        # Mock Firestore operations
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "personal_info": {"full_name": "John Doe"},
            "projects": [],
            "work_experiences": [],
            "education": [],
            "certifications": [],
            "text_blobs": {},
            "metadata": {"source_type": "resume_pdf"},
            "updated_at": datetime.utcnow(),
        }

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test retrieval
        result = portfolio_service.get_portfolio_data("user123")

        # Assertions
        assert result is not None
        assert isinstance(result, PortfolioData)
        assert result.personal_info.full_name == "John Doe"
        mock_firestore.collection.assert_called_once_with("portfolios")
        mock_firestore.collection.return_value.document.assert_called_once_with(
            "user123"
        )

    def test_get_portfolio_data_not_found(self, portfolio_service, mock_firestore):
        """Test portfolio data retrieval when document doesn't exist."""
        # Mock Firestore operations
        mock_doc = Mock()
        mock_doc.exists = False

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test retrieval
        result = portfolio_service.get_portfolio_data("user123")

        # Assertions
        assert result is None

    def test_get_portfolio_data_failure(self, portfolio_service, mock_firestore):
        """Test portfolio data retrieval failure."""
        # Mock Firestore to raise exception
        mock_firestore.collection.side_effect = Exception("Firestore error")

        # Test retrieval failure
        with pytest.raises(FirebaseError, match="Failed to retrieve portfolio data"):
            portfolio_service.get_portfolio_data("user123")

    def test_get_portfolio_by_username_success(self, portfolio_service, mock_firestore):
        """Test successful portfolio data retrieval by username."""
        # Mock user_settings query
        mock_user_doc = Mock()
        mock_user_doc.to_dict.return_value = {
            "user_id": "user123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
        }

        mock_query = Mock()
        mock_query.stream.return_value = iter([mock_user_doc])

        mock_user_settings_collection = Mock()
        mock_user_settings_collection.where.return_value.limit.return_value = mock_query

        # Mock portfolio document
        mock_portfolio_doc = Mock()
        mock_portfolio_doc.exists = True
        mock_portfolio_doc.to_dict.return_value = {
            "personal_info": {"full_name": "John Doe"},
            "projects": [],
            "work_experiences": [],
            "education": [],
            "certifications": [],
            "text_blobs": {},
            "metadata": {"source_type": "resume_pdf"},
            "updated_at": datetime.utcnow(),
        }

        mock_portfolio_doc_ref = Mock()
        mock_portfolio_doc_ref.get.return_value = mock_portfolio_doc

        # Setup collection mock to return different collections
        def collection_side_effect(name):
            if name == "user_settings":
                return mock_user_settings_collection
            elif name == "portfolios":
                mock_portfolios = Mock()
                mock_portfolios.document.return_value = mock_portfolio_doc_ref
                return mock_portfolios

        mock_firestore.collection.side_effect = collection_side_effect

        # Test retrieval by username
        result = portfolio_service.get_portfolio_by_username("johndoe")

        # Assertions
        assert result is not None
        assert isinstance(result, PortfolioData)
        assert result.personal_info.full_name == "John Doe"

    def test_get_portfolio_by_username_not_found(
        self, portfolio_service, mock_firestore
    ):
        """Test portfolio retrieval by username when username doesn't exist."""
        # Mock empty query result
        mock_query = Mock()
        mock_query.stream.return_value = iter([])

        mock_user_settings_collection = Mock()
        mock_user_settings_collection.where.return_value.limit.return_value = mock_query

        mock_firestore.collection.return_value = mock_user_settings_collection

        # Test retrieval
        result = portfolio_service.get_portfolio_by_username("nonexistent")

        # Assertions
        assert result is None

    def test_map_github_only_data(self, portfolio_service, sample_github_repos):
        """Test mapping GitHub repositories to portfolio data."""
        # Test mapping
        result = portfolio_service.map_github_only_data(sample_github_repos)

        # Assertions
        assert isinstance(result, PortfolioData)
        assert len(result.projects) == 2

        # Check first project
        project1 = result.projects[0]
        assert project1.name == "awesome-project"
        assert "Python" in project1.technologies
        # Only language is included, not topics
        assert project1.github == "https://github.com/user/awesome-project"
        assert "150 stars" in project1.highlights
        assert isinstance(project1.highlights, str)  # highlights is now a string

        # Check second project
        project2 = result.projects[1]
        assert project2.name == "react-app"
        assert "JavaScript" in project2.technologies

        # Check metadata
        assert result.metadata.source_type == "github_only"
        assert "2 GitHub repositories" in result.metadata.notes

    def test_map_github_only_data_empty_list(self, portfolio_service):
        """Test mapping empty GitHub repositories list."""
        result = portfolio_service.map_github_only_data([])

        assert isinstance(result, PortfolioData)
        assert len(result.projects) == 0
        assert result.metadata.source_type == "github_only"
        assert "0 GitHub repositories" in result.metadata.notes

    def test_portfolio_exists_true(self, portfolio_service, mock_firestore):
        """Test portfolio existence check when portfolio exists."""
        # Mock Firestore operations
        mock_doc = Mock()
        mock_doc.exists = True

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test existence check
        result = portfolio_service.portfolio_exists("user123")

        assert result is True

    def test_portfolio_exists_false(self, portfolio_service, mock_firestore):
        """Test portfolio existence check when portfolio doesn't exist."""
        # Mock Firestore operations
        mock_doc = Mock()
        mock_doc.exists = False

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test existence check
        result = portfolio_service.portfolio_exists("user123")

        assert result is False

    def test_portfolio_exists_error(self, portfolio_service, mock_firestore):
        """Test portfolio existence check with error."""
        # Mock Firestore to raise exception
        mock_firestore.collection.side_effect = Exception("Firestore error")

        # Test existence check with error
        result = portfolio_service.portfolio_exists("user123")

        assert result is False

    def test_delete_portfolio_data_success(self, portfolio_service, mock_firestore):
        """Test successful portfolio data deletion."""
        # Mock Firestore operations
        mock_doc_ref = Mock()
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test deletion
        result = portfolio_service.delete_portfolio_data("user123")

        # Assertions
        assert result is True
        mock_doc_ref.delete.assert_called_once()

    def test_delete_portfolio_data_failure(self, portfolio_service, mock_firestore):
        """Test portfolio data deletion failure."""
        # Mock Firestore to raise exception
        mock_firestore.collection.side_effect = Exception("Firestore error")

        # Test deletion failure
        result = portfolio_service.delete_portfolio_data("user123")

        assert result is False

    def test_get_portfolio_service_singleton(self):
        """Test that get_portfolio_service returns the same instance."""
        with patch(
            "app.services.portfolio_service.PortfolioService"
        ) as mock_service_class:
            mock_instance = Mock()
            mock_service_class.return_value = mock_instance

            # Clear the global instance
            import app.services.portfolio_service

            app.services.portfolio_service._portfolio_service = None

            # Get service twice
            service1 = get_portfolio_service()
            service2 = get_portfolio_service()

            # Should be the same instance
            assert service1 is service2
            # Should only create once
            mock_service_class.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_photo_existing_portfolio(
        self, portfolio_service, mock_firestore
    ):
        """Test updating profile photo for existing portfolio."""
        # Mock existing portfolio document
        mock_doc = Mock()
        mock_doc.exists = True

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test update
        photo_url = "https://storage.azure.com/user123/profile-photo.webp"
        result = await portfolio_service.update_profile_photo("user123", photo_url)

        # Assertions
        assert result is True
        mock_firestore.collection.assert_called_with("portfolios")
        mock_firestore.collection.return_value.document.assert_called_with("user123")
        mock_doc_ref.update.assert_called_once()

        # Check update call arguments
        call_args = mock_doc_ref.update.call_args[0][0]
        assert call_args["personal_info.profile_photo_url"] == photo_url
        assert "updated_at" in call_args

    @pytest.mark.asyncio
    async def test_update_profile_photo_new_portfolio(
        self, portfolio_service, mock_firestore
    ):
        """Test updating profile photo when portfolio doesn't exist."""
        # Mock non-existing portfolio document
        mock_doc = Mock()
        mock_doc.exists = False

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test update
        photo_url = "https://storage.azure.com/user123/profile-photo.webp"
        result = await portfolio_service.update_profile_photo("user123", photo_url)

        # Assertions
        assert result is True
        mock_doc_ref.set.assert_called_once()

        # Check set call arguments
        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["personal_info"]["profile_photo_url"] == photo_url
        assert "updated_at" in call_args

    @pytest.mark.asyncio
    async def test_update_profile_photo_remove_photo(
        self, portfolio_service, mock_firestore
    ):
        """Test removing profile photo by setting it to None."""
        # Mock existing portfolio document
        mock_doc = Mock()
        mock_doc.exists = True

        mock_doc_ref = Mock()
        mock_doc_ref.get.return_value = mock_doc
        mock_firestore.collection.return_value.document.return_value = mock_doc_ref

        # Test update with None
        result = await portfolio_service.update_profile_photo("user123", None)

        # Assertions
        assert result is True
        mock_doc_ref.update.assert_called_once()

        # Check update call arguments
        call_args = mock_doc_ref.update.call_args[0][0]
        assert call_args["personal_info.profile_photo_url"] is None

    @pytest.mark.asyncio
    async def test_update_profile_photo_failure(
        self, portfolio_service, mock_firestore
    ):
        """Test profile photo update failure."""
        # Mock Firestore to raise exception
        mock_firestore.collection.side_effect = Exception("Firestore error")

        # Test update failure
        with pytest.raises(FirebaseError, match="Failed to update profile photo"):
            await portfolio_service.update_profile_photo(
                "user123", "https://example.com/photo.jpg"
            )


class TestGitHubRepoMapping:
    """Test specific GitHub repository mapping scenarios."""

    def test_repo_with_no_language(self):
        """Test mapping repository with no language specified."""
        service = PortfolioService()
        service._db = Mock()  # Mock the database

        repos = [
            GitHubRepoData(
                id=1,
                name="config-repo",
                description="Configuration files",
                url="https://github.com/user/config-repo",
                language=None,
                stars=5,
                fork=False,
                private=False,
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            )
        ]

        result = service.map_github_only_data(repos)

        project = result.projects[0]
        assert project.name == "config-repo"
        assert project.technologies == []  # No language, no topics in schema

    def test_repo_with_no_topics(self):
        """Test mapping repository with no topics."""
        service = PortfolioService()
        service._db = Mock()

        repos = [
            GitHubRepoData(
                id=1,
                name="simple-repo",
                description="A simple repository",
                url="https://github.com/user/simple-repo",
                language="Python",
                stars=0,
                fork=False,
                private=False,
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            )
        ]

        result = service.map_github_only_data(repos)

        project = result.projects[0]
        assert project.name == "simple-repo"
        assert project.technologies == ["Python"]  # Only language

    def test_repo_with_zero_stars_and_forks(self):
        """Test mapping repository with zero stars and forks."""
        service = PortfolioService()
        service._db = Mock()

        repos = [
            GitHubRepoData(
                id=1,
                name="new-repo",
                description="A new repository",
                url="https://github.com/user/new-repo",
                language="JavaScript",
                stars=0,
                fork=False,
                private=False,
                created_at="2023-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            )
        ]

        result = service.map_github_only_data(repos)

        project = result.projects[0]
        # Should not include "0 stars" in highlights
        highlights_text = project.highlights or ""
        assert "0 stars" not in highlights_text
        assert (
            "A new repository" in highlights_text
        )  # Description should be in highlights
