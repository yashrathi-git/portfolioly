"""
GitHub integration service for upload onboarding flow.

This module provides GitHub API integration for fetching user repositories
and handling repository data for portfolio auto-population.
"""

import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import re
import logging

from github import (
    Github,
    GithubException,
    UnknownObjectException,
    RateLimitExceededException,
)
from pydantic import BaseModel, Field
from pydantic import AliasChoices
from fastapi import HTTPException

from ..core.config import settings


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


class GitHubService:
    """GitHub API integration service."""

    def __init__(self, token: Optional[str] = None):
        """
        Initialize GitHub service.

        Args:
            token: Optional GitHub API token for higher rate limits
        """
        self.logger = logging.getLogger(self.__class__.__name__)

        self.token = token or settings.upload.GITHUB_API_TOKEN
        self.timeout = settings.upload.GITHUB_API_TIMEOUT
        self.max_repos = settings.upload.MAX_GITHUB_REPOS
        self.repos_per_page = settings.upload.GITHUB_REPOS_PER_PAGE

        # Initialize GitHub client
        if self.token:
            self.github = Github(self.token, timeout=self.timeout, retry=None)
            self.logger.info(
                "GitHub client initialized with personal access token (retry disabled)"
            )
        else:
            self.github = Github(timeout=self.timeout, retry=None)
            self.logger.info(
                "GitHub client initialized without token (anonymous, retry disabled)"
            )

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
            self.logger.warning(
                "GitHub rate limit exceeded: remaining=%s reset_in=%ss",
                getattr(e, "remaining", "unknown"),
                getattr(e, "retry_after", 3600),
            )
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
            self.logger.info("GitHub user not found: %s", username)
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "GitHub user not found",
                    "error_code": "USER_NOT_FOUND",
                    "username": username,
                },
            )
        except GithubException as e:
            self.logger.error(
                "GitHub exception (status=%s): %s", getattr(e, "status", "?"), e
            )
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
            self.logger.exception(
                "Unexpected error while fetching repos for %s", username
            )
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
        # Log current rate limit before call when available
        try:
            rl = self.github.get_rate_limit()
            self.logger.debug(
                "RateLimit before request: core.remaining=%s reset=%s",
                getattr(rl.core, "remaining", None),
                getattr(getattr(rl.core, "reset", None), "timestamp", lambda: None)(),
            )
        except Exception:
            pass

        user = self.github.get_user(username)

        # Get public repositories with proper pagination
        # Note: GitHub API doesn't support sorting by stars directly, so we use 'updated' sort
        # We'll sort each page by stars after fetching
        repos_paginated = user.get_repos(
            type="public", sort="updated", direction="desc"
        )

        total_count = repos_paginated.totalCount

        # Calculate which repos to fetch for this page
        start_index = (page - 1) * per_page
        end_index = start_index + per_page

        # Convert to our model - only fetch the repos we need for this page
        repo_list = []
        for i, repo in enumerate(repos_paginated):
            if i < start_index:
                continue
            if i >= end_index:
                break

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

        # Sort this page by stars (only the current page)
        repo_list.sort(key=lambda r: r.stars, reverse=True)

        # Check if there are more pages
        has_next = end_index < total_count

        response = PaginatedRepoResponse(
            repos=repo_list,
            total_count=total_count,
            page=page,
            per_page=per_page,
            has_next=has_next,
        )

        # Log post-call rate limit
        try:
            rl = self.github.get_rate_limit()
            self.logger.debug(
                "RateLimit after request: core.remaining=%s reset=%s",
                getattr(rl.core, "remaining", None),
                getattr(getattr(rl.core, "reset", None), "timestamp", lambda: None)(),
            )
        except Exception:
            pass

        return response

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
            self.logger.info("Repository not found: %s/%s", owner, repo_name)
            raise HTTPException(
                status_code=404,
                detail={
                    "message": "Repository not found",
                    "error_code": "REPO_NOT_FOUND",
                    "repository": f"{owner}/{repo_name}",
                },
            )
        except GithubException as e:
            self.logger.error(
                "GitHub service error while reading repo %s/%s: %s", owner, repo_name, e
            )
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
