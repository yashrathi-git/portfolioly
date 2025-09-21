"""
Unit tests for GitHub integration service.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from fastapi import HTTPException

from github import GithubException, UnknownObjectException, RateLimitExceededException

from app.services.github_service import (
    GitHubService,
    GitHubRepo,
    PaginatedRepoResponse,
    GitHubImportRequest,
    GitHubImportResponse,
)


class TestGitHubService:
    """Test cases for GitHubService."""

    @pytest.fixture
    def github_service(self):
        return GitHubService()

    @pytest.fixture
    def mock_repo_data(self):
        """Mock repository data."""
        return {
            "id": 123456,
            "name": "test-repo",
            "description": "A test repository",
            "stargazers_count": 42,
            "html_url": "https://github.com/testuser/test-repo",
            "language": "Python",
            "fork": False,
            "private": False,
            "created_at": datetime(2023, 1, 1),
            "updated_at": datetime(2023, 12, 1),
        }

    def test_validate_username_valid(self, github_service):
        """Test that valid usernames are accepted."""
        valid_usernames = [
            "user",
            "user123",
            "user-name",
            "123user",
            "a",
            "a" * 39,  # Maximum length
            "user-123-name",
        ]

        for username in valid_usernames:
            assert github_service.validate_username(username) is True

    def test_validate_username_invalid(self, github_service):
        """Test that invalid usernames are rejected."""
        invalid_usernames = [
            "",
            None,
            "-user",  # Starts with hyphen
            "user-",  # Ends with hyphen
            "user--name",  # Double hyphen
            "user@name",  # Invalid character
            "user.name",  # Invalid character
            "a" * 40,  # Too long
            123,  # Not a string
            "user name",  # Space
        ]

        for username in invalid_usernames:
            assert github_service.validate_username(username) is False

    @pytest.mark.asyncio
    async def test_fetch_user_repos_invalid_username(self, github_service):
        """Test that invalid usernames raise HTTPException."""
        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("invalid-username-")

        assert exc_info.value.status_code == 400
        assert "INVALID_USERNAME" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_fetch_user_repos_invalid_page(self, github_service):
        """Test that invalid page numbers raise HTTPException."""
        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("validuser", page=0)

        assert exc_info.value.status_code == 400
        assert "INVALID_PAGE" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_fetch_user_repos_invalid_per_page(self, github_service):
        """Test that invalid per_page values raise HTTPException."""
        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("validuser", per_page=101)

        assert exc_info.value.status_code == 400
        assert "INVALID_PER_PAGE" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_fetch_user_repos_success(
        self, mock_github_class, github_service, mock_repo_data
    ):
        """Test successful repository fetching."""
        # Mock GitHub API objects
        mock_repo = Mock()
        for key, value in mock_repo_data.items():
            setattr(mock_repo, key, value)

        mock_repos = Mock()
        mock_repos.totalCount = 1
        mock_repos.__iter__ = Mock(return_value=iter([mock_repo]))

        mock_user = Mock()
        mock_user.get_repos.return_value = mock_repos

        mock_github = Mock()
        mock_github.get_user.return_value = mock_user
        mock_github_class.return_value = mock_github

        # Test the method
        result = await github_service.fetch_user_repos("testuser", page=1, per_page=20)

        assert isinstance(result, PaginatedRepoResponse)
        assert len(result.repos) == 1
        assert result.total_count == 1
        assert result.page == 1
        assert result.per_page == 20
        assert result.has_next is False

        repo = result.repos[0]
        assert repo.id == mock_repo_data["id"]
        assert repo.name == mock_repo_data["name"]
        assert repo.description == mock_repo_data["description"]
        assert repo.stars == mock_repo_data["stargazers_count"]

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_fetch_user_repos_user_not_found(
        self, mock_github_class, github_service
    ):
        """Test handling of non-existent users."""
        mock_github = Mock()
        mock_github.get_user.side_effect = UnknownObjectException(404, "Not Found")
        mock_github_class.return_value = mock_github

        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("nonexistentuser")

        assert exc_info.value.status_code == 404
        assert "USER_NOT_FOUND" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_fetch_user_repos_rate_limit(self, mock_github_class, github_service):
        """Test handling of rate limit exceeded."""
        mock_github = Mock()
        rate_limit_exception = RateLimitExceededException(403, "Rate limit exceeded")
        rate_limit_exception.retry_after = 3600
        mock_github.get_user.side_effect = rate_limit_exception
        mock_github_class.return_value = mock_github

        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("testuser")

        assert exc_info.value.status_code == 429
        assert "GITHUB_RATE_LIMIT" in str(exc_info.value.detail)
        assert "Retry-After" in exc_info.value.headers

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_fetch_user_repos_github_exception(
        self, mock_github_class, github_service
    ):
        """Test handling of general GitHub exceptions."""
        mock_github = Mock()
        mock_github.get_user.side_effect = GithubException(503, "Service Unavailable")
        mock_github_class.return_value = mock_github

        with pytest.raises(HTTPException) as exc_info:
            await github_service.fetch_user_repos("testuser")

        assert exc_info.value.status_code == 503
        assert "GITHUB_SERVICE_ERROR" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_get_repo_details_success(
        self, mock_github_class, github_service, mock_repo_data
    ):
        """Test successful repository detail fetching."""
        mock_repo = Mock()
        for key, value in mock_repo_data.items():
            setattr(mock_repo, key, value)

        mock_github = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github

        result = await github_service.get_repo_details("testuser", "test-repo")

        assert isinstance(result, GitHubRepo)
        assert result.id == mock_repo_data["id"]
        assert result.name == mock_repo_data["name"]
        assert result.description == mock_repo_data["description"]

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_get_repo_details_not_found(self, mock_github_class, github_service):
        """Test handling of non-existent repositories."""
        mock_github = Mock()
        mock_github.get_repo.side_effect = UnknownObjectException(404, "Not Found")
        mock_github_class.return_value = mock_github

        with pytest.raises(HTTPException) as exc_info:
            await github_service.get_repo_details("testuser", "nonexistent-repo")

        assert exc_info.value.status_code == 404
        assert "REPO_NOT_FOUND" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_import_repositories_success(self, github_service):
        """Test successful repository import."""
        repo_ids = [123, 456, 789]

        result = await github_service.import_repositories(repo_ids)

        assert isinstance(result, GitHubImportResponse)
        assert result.imported == 3
        assert "Successfully imported 3 repositories" in result.message

    @pytest.mark.asyncio
    async def test_import_repositories_too_many(self, github_service):
        """Test import with too many repositories."""
        # Create more repo IDs than the maximum allowed
        repo_ids = list(range(github_service.max_repos + 1))

        with pytest.raises(HTTPException) as exc_info:
            await github_service.import_repositories(repo_ids)

        assert exc_info.value.status_code == 400
        assert "TOO_MANY_REPOS" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_import_repositories_empty_list(self, github_service):
        """Test import with empty repository list."""
        with pytest.raises(HTTPException) as exc_info:
            await github_service.import_repositories([])

        assert exc_info.value.status_code == 400
        assert "NO_REPOS_SELECTED" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_get_rate_limit_info_success(self, mock_github_class, github_service):
        """Test successful rate limit info retrieval."""
        mock_core = Mock()
        mock_core.limit = 5000
        mock_core.remaining = 4500
        mock_core.reset = Mock()
        mock_core.reset.timestamp.return_value = 1640995200.0
        mock_core.used = 500

        mock_search = Mock()
        mock_search.limit = 30
        mock_search.remaining = 25
        mock_search.reset = Mock()
        mock_search.reset.timestamp.return_value = 1640995200.0
        mock_search.used = 5

        mock_rate_limit = Mock()
        mock_rate_limit.core = mock_core
        mock_rate_limit.search = mock_search

        mock_github = Mock()
        mock_github.get_rate_limit.return_value = mock_rate_limit
        mock_github_class.return_value = mock_github

        result = await github_service.get_rate_limit_info()

        assert "core" in result
        assert "search" in result
        assert result["core"]["limit"] == 5000
        assert result["core"]["remaining"] == 4500
        assert result["search"]["limit"] == 30
        assert result["search"]["remaining"] == 25

    @pytest.mark.asyncio
    @patch("app.services.github_service.Github")
    async def test_get_rate_limit_info_error(self, mock_github_class, github_service):
        """Test rate limit info retrieval with error."""
        mock_github = Mock()
        mock_github.get_rate_limit.side_effect = Exception("API Error")
        mock_github_class.return_value = mock_github

        result = await github_service.get_rate_limit_info()

        assert "error" in result
        assert "Could not fetch rate limit info" in result["error"]


class TestGitHubModels:
    """Test cases for GitHub data models."""

    def test_github_repo_model(self):
        """Test GitHubRepo model creation and field aliases."""
        repo_data = {
            "id": 123,
            "name": "test-repo",
            "description": "Test repository",
            "stargazers_count": 42,
            "html_url": "https://github.com/user/repo",
            "language": "Python",
            "fork": False,
            "private": False,
            "created_at": datetime(2023, 1, 1),
            "updated_at": datetime(2023, 12, 1),
        }

        repo = GitHubRepo(**repo_data)

        assert repo.id == 123
        assert repo.name == "test-repo"
        assert repo.stars == 42  # Should use alias
        assert repo.url == "https://github.com/user/repo"  # Should use alias
        assert repo.language == "Python"

    def test_github_repo_model_minimal(self):
        """Test GitHubRepo model with minimal required fields."""
        repo_data = {
            "id": 123,
            "name": "test-repo",
            "html_url": "https://github.com/user/repo",
            "fork": False,
            "private": False,
            "created_at": datetime(2023, 1, 1),
            "updated_at": datetime(2023, 12, 1),
        }

        repo = GitHubRepo(**repo_data)

        assert repo.id == 123
        assert repo.name == "test-repo"
        assert repo.description is None
        assert repo.stars == 0  # Default value
        assert repo.language is None

    def test_paginated_repo_response_model(self):
        """Test PaginatedRepoResponse model."""
        repo = GitHubRepo(
            id=123,
            name="test-repo",
            html_url="https://github.com/user/repo",
            fork=False,
            private=False,
            created_at=datetime(2023, 1, 1),
            updated_at=datetime(2023, 12, 1),
        )

        response = PaginatedRepoResponse(
            repos=[repo], total_count=1, page=1, per_page=20, has_next=False
        )

        assert len(response.repos) == 1
        assert response.total_count == 1
        assert response.page == 1
        assert response.per_page == 20
        assert response.has_next is False

    def test_github_import_request_validation(self):
        """Test GitHubImportRequest validation."""
        # Valid request
        request = GitHubImportRequest(repo_ids=[1, 2, 3])
        assert len(request.repo_ids) == 3

        # Test max_items validation would be handled by Pydantic
        # This is more of an integration test with the actual validation

    def test_github_import_response_model(self):
        """Test GitHubImportResponse model."""
        response = GitHubImportResponse(
            imported=5, message="Successfully imported 5 repositories"
        )

        assert response.imported == 5
        assert "Successfully imported" in response.message


def test_get_github_service_singleton():
    """Test that get_github_service returns instances correctly."""
    from app.services.github_service import get_github_service

    service1 = get_github_service()
    service2 = get_github_service()

    # Should return the same instance when no token provided
    assert service1 is service2

    # Should return new instance when token provided
    service3 = get_github_service(token="test_token")
    assert service3 is not service1


@pytest.mark.asyncio
async def test_pagination_logic():
    """Test pagination logic in repository fetching."""
    service = GitHubService()

    # Mock data for testing pagination
    mock_repos = []
    for i in range(25):  # 25 repos total
        mock_repo = Mock()
        mock_repo.id = i
        mock_repo.name = f"repo-{i}"
        mock_repo.description = f"Description {i}"
        mock_repo.stargazers_count = i
        mock_repo.html_url = f"https://github.com/user/repo-{i}"
        mock_repo.language = "Python"
        mock_repo.fork = False
        mock_repo.private = False
        mock_repo.created_at = datetime(2023, 1, 1)
        mock_repo.updated_at = datetime(2023, 12, 1)
        mock_repos.append(mock_repo)

    with patch("app.services.github_service.Github") as mock_github_class:
        mock_repos_paginated = Mock()
        mock_repos_paginated.totalCount = 25
        mock_repos_paginated.__iter__ = Mock(return_value=iter(mock_repos))

        mock_user = Mock()
        mock_user.get_repos.return_value = mock_repos_paginated

        mock_github = Mock()
        mock_github.get_user.return_value = mock_user
        mock_github_class.return_value = mock_github

        # Test first page
        result = await service.fetch_user_repos("testuser", page=1, per_page=10)
        assert len(result.repos) == 10
        assert result.page == 1
        assert result.has_next is True
        assert result.repos[0].name == "repo-0"
        assert result.repos[9].name == "repo-9"

        # Test second page
        result = await service.fetch_user_repos("testuser", page=2, per_page=10)
        assert len(result.repos) == 10
        assert result.page == 2
        assert result.has_next is True
        assert result.repos[0].name == "repo-10"
        assert result.repos[9].name == "repo-19"

        # Test last page
        result = await service.fetch_user_repos("testuser", page=3, per_page=10)
        assert len(result.repos) == 5  # Only 5 repos left
        assert result.page == 3
        assert result.has_next is False
        assert result.repos[0].name == "repo-20"
        assert result.repos[4].name == "repo-24"
