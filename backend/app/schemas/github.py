"""GitHub-related Pydantic schemas."""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, AliasChoices


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
