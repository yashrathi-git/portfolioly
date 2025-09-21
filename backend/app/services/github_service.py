"""
GitHub integration service for upload onboarding flow.

This module provides GitHub API integration for fetching user repositories
and handling repository data for portfolio auto-population.
"""

import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

from github import (
    Github,
    GithubException,
    UnknownObjectException,
    RateLimitExceededException,
)
from pydantic import BaseModel, Field
from pydantic import AliasChoices
from fastapi import HTTPException

from ..core.upload_config import upload_config


class GitHubRepo(BaseModel):
    """GitHub repository model."""

    id: int
    name: str
    description: Optional[str] = None
    stars: int = Field(
        default=0, validation_alias=AliasChoices("stars", "stargazers_count")
    )
    url: str = Field(validation_alias=AliasChoices("url", "html_url"))
    language: Optional[str] = None
    fork: bool = False
    private: bool = False
    created_at: datetime
    updated_at: datetime


class PaginatedRepoResponse(BaseModel):
    """Paginated repository response model."""

    repos: List[GitHubRepo]
    total_count: int
    page: int
    per_page: int
    has_next: bool


class GitHubImportRequest(BaseModel):
    """GitHub repository import request model."""

    repo_ids: List[int] = Field(..., max_items=upload_config.MAX_GITHUB_REPOS)


class GitHubImportResponse(BaseModel):
    """GitHub repository import response model."""

    imported: int
    message: str


class GitHubService:
    """GitHub API integration service."""

    def __init__(self, token: Optional[str] = None):
        """
        Initialize GitHub service.

        Args:
            token: Optional GitHub API token for higher rate limits
        """
        self.token = token or upload_config.GITHUB_API_TOKEN
        self.timeout = upload_config.GITHUB_API_TIMEOUT
        self.max_repos = upload_config.MAX_GITHUB_REPOS
        self.repos_per_page = upload_config.GITHUB_REPOS_PER_PAGE

        # Initialize GitHub client
        if self.token:
            self.github = Github(self.token, timeout=self.timeout)
        else:
            self.github = Github(timeout=self.timeout)

    async def fetch_user_repos(
        self, username: str, page: int = 1, per_page: Optional[int] = None
    ) -> PaginatedRepoResponse:
        """
        Fetch user repositories with pagination.

        Args:
            username: GitHub username
            page: Page number (1-based)
            per_page: Number of repos per page (defaults to config value)

        Returns:
            PaginatedRepoResponse with repository data

        Raises:
            HTTPException: For various GitHub API errors
        """
        if not self.validate_username(username):
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid GitHub username format",
                    "error_code": "INVALID_USERNAME",
                },
            )

        per_page = per_page or self.repos_per_page

        # Validate pagination parameters
        if page < 1:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Page number must be >= 1",
                    "error_code": "INVALID_PAGE",
                },
            )

        if per_page < 1 or per_page > 100:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Per page must be between 1 and 100",
                    "error_code": "INVALID_PER_PAGE",
                },
            )

        try:
            # Run GitHub API call in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, self._fetch_repos_sync, username, page, per_page
            )
            return result

        except HTTPException:
            raise
        except RateLimitExceededException as e:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "GitHub API rate limit exceeded",
                    "error_code": "GITHUB_RATE_LIMIT",
                    "retry_after": e.retry_after if hasattr(e, "retry_after") else 3600,
                },
                headers={"Retry-After": str(getattr(e, "retry_after", 3600))},
            )
        except UnknownObjectException:
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "GitHub user not found",
                    "error_code": "USER_NOT_FOUND",
                    "username": username,
                },
            )
        except GithubException as e:
            if e.status == 403:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "message": "GitHub API access forbidden",
                        "error_code": "GITHUB_FORBIDDEN",
                        "details": str(e),
                    },
                )
            elif e.status == 404:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "message": "GitHub user not found",
                        "error_code": "USER_NOT_FOUND",
                        "username": username,
                    },
                )
            else:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "message": "GitHub API service unavailable",
                        "error_code": "GITHUB_SERVICE_ERROR",
                        "details": str(e),
                    },
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Internal server error while fetching repositories",
                    "error_code": "INTERNAL_ERROR",
                    "details": str(e),
                },
            )

    def _fetch_repos_sync(
        self, username: str, page: int, per_page: int
    ) -> PaginatedRepoResponse:
        """
        Synchronous repository fetching (runs in thread pool).

        Args:
            username: GitHub username
            page: Page number
            per_page: Repositories per page

        Returns:
            PaginatedRepoResponse
        """
        user = self.github.get_user(username)

        # Get public repositories only
        repos = user.get_repos(type="public", sort="updated", direction="desc")

        # Calculate pagination
        total_count = repos.totalCount
        start_index = (page - 1) * per_page
        end_index = start_index + per_page

        # Get the page of repositories
        repo_list = []
        for i, repo in enumerate(repos):
            if i < start_index:
                continue
            if i >= end_index:
                break

            # Convert to our model
            repo_data = GitHubRepo(
                id=repo.id,
                name=repo.name,
                description=repo.description,
                stars=repo.stargazers_count,
                url=repo.html_url,
                language=repo.language,
                fork=repo.fork,
                private=repo.private,
                created_at=repo.created_at,
                updated_at=repo.updated_at,
            )
            repo_list.append(repo_data)

        # Check if there are more pages
        has_next = end_index < total_count

        return PaginatedRepoResponse(
            repos=repo_list,
            total_count=total_count,
            page=page,
            per_page=per_page,
            has_next=has_next,
        )

    async def get_repo_details(self, owner: str, repo_name: str) -> GitHubRepo:
        """
        Get detailed information about a specific repository.

        Args:
            owner: Repository owner username
            repo_name: Repository name

        Returns:
            GitHubRepo with detailed information

        Raises:
            HTTPException: For various GitHub API errors
        """
        try:
            loop = asyncio.get_event_loop()
            repo = await loop.run_in_executor(
                None, lambda: self.github.get_repo(f"{owner}/{repo_name}")
            )

            return GitHubRepo(
                id=repo.id,
                name=repo.name,
                description=repo.description,
                stars=repo.stargazers_count,
                url=repo.html_url,
                language=repo.language,
                fork=repo.fork,
                private=repo.private,
                created_at=repo.created_at,
                updated_at=repo.updated_at,
            )

        except UnknownObjectException:
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "Repository not found",
                    "error_code": "REPO_NOT_FOUND",
                    "repository": f"{owner}/{repo_name}",
                },
            )
        except GithubException as e:
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "GitHub API service unavailable",
                    "error_code": "GITHUB_SERVICE_ERROR",
                    "details": str(e),
                },
            )

    def validate_username(self, username: str) -> bool:
        """
        Validate GitHub username format.

        Args:
            username: Username to validate

        Returns:
            True if valid, False otherwise
        """
        if not username or not isinstance(username, str):
            return False

        # GitHub username rules:
        # - May only contain alphanumeric characters or single hyphens
        # - Cannot begin or end with a hyphen
        # - Maximum 39 characters
        pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$"
        return bool(re.match(pattern, username))

    async def import_repositories(self, repo_ids: List[int]) -> GitHubImportResponse:
        """
        Import selected repositories (placeholder for actual import logic).

        Args:
            repo_ids: List of repository IDs to import

        Returns:
            GitHubImportResponse with import results

        Raises:
            HTTPException: If validation fails
        """
        if len(repo_ids) > self.max_repos:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Maximum {self.max_repos} repositories allowed",
                    "error_code": "TOO_MANY_REPOS",
                    "max_allowed": self.max_repos,
                    "requested": len(repo_ids),
                },
            )

        if not repo_ids:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "No repositories selected for import",
                    "error_code": "NO_REPOS_SELECTED",
                },
            )

        # TODO: Implement actual repository import logic
        # This would typically involve:
        # 1. Fetching repository details for each ID
        # 2. Storing repository information in the database
        # 3. Associating repositories with the user's portfolio

        imported_count = len(repo_ids)

        return GitHubImportResponse(
            imported=imported_count,
            message=f"Successfully imported {imported_count} repositories",
        )

    async def get_rate_limit_info(self) -> Dict[str, Any]:
        """
        Get current GitHub API rate limit information.

        Returns:
            Dictionary with rate limit information
        """
        try:
            loop = asyncio.get_event_loop()
            rate_limit = await loop.run_in_executor(
                None, lambda: self.github.get_rate_limit()
            )

            return {
                "core": {
                    "limit": rate_limit.core.limit,
                    "remaining": rate_limit.core.remaining,
                    "reset": rate_limit.core.reset.timestamp(),
                    "used": rate_limit.core.used,
                },
                "search": {
                    "limit": rate_limit.search.limit,
                    "remaining": rate_limit.search.remaining,
                    "reset": rate_limit.search.reset.timestamp(),
                    "used": rate_limit.search.used,
                },
            }
        except Exception as e:
            return {"error": f"Could not fetch rate limit info: {str(e)}"}


# Global GitHub service instance
_github_service: Optional[GitHubService] = None


def get_github_service(token: Optional[str] = None) -> GitHubService:
    """Get the global GitHub service instance."""
    global _github_service
    if _github_service is None or token:
        _github_service = GitHubService(token=token)
    return _github_service
