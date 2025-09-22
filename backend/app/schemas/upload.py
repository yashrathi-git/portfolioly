"""Upload flow-related Pydantic schemas."""

from typing import List, Optional
from pydantic import BaseModel


class GitHubRepoData(BaseModel):
    """GitHub repository data for submission."""

    id: int
    name: str
    description: Optional[str]
    stars: int
    url: str
    language: Optional[str]
    fork: bool
    private: bool
    created_at: str
    updated_at: str


class PDFData(BaseModel):
    """PDF upload data for submission."""

    text: str
    source: str
    filename: str
    pages: int
    size: int
    checksum: str
    processed_at: str
    blob_url: Optional[str]


class UploadSubmissionRequest(BaseModel):
    """Complete upload submission request."""

    linkedin_pdf: Optional[PDFData] = None
    resume_pdf: Optional[PDFData] = None
    github_repos: List[GitHubRepoData] = []


class UploadSubmissionResponse(BaseModel):
    """Upload submission response."""

    success: bool
    message: str
    data: dict
