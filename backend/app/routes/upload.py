"""
Upload API routes for onboarding flow.

This module provides API endpoints for PDF upload and GitHub integration
functionality in the upload onboarding flow.
"""

from typing import Literal
from fastapi import APIRouter, UploadFile, File, Query, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..auth.middleware import require_verified_email
from ..auth.models import UserToken
from ..services.pdf_processor import get_pdf_processor, PDFParseResult
from ..services.github_service import (
    get_github_service,
    PaginatedRepoResponse,
    GitHubImportRequest,
    GitHubImportResponse,
)
from ..dependencies.rate_limiting import (
    check_pdf_upload_rate_limit,
    check_github_api_rate_limit,
)
from ..core.config import settings

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/ingest/pdf", response_model=dict)
async def upload_pdf(
    file: UploadFile = File(...),
    source: Literal["linkedin", "resume"] = Query(
        ..., description="Source type of the PDF"
    ),
    user: UserToken = Depends(require_verified_email),
    _rate_limit: None = Depends(check_pdf_upload_rate_limit),
) -> JSONResponse:
    """
    Upload and process PDF file for text extraction.

    This endpoint accepts PDF files, validates them, extracts text content,
    and returns the processed data for portfolio auto-population.

    Args:
        file: PDF file to upload
        source: Source type ("linkedin" or "resume")
        user: Authenticated user with verified email
        _rate_limit: Rate limiting dependency

    Returns:
        JSON response with extracted text and metadata

    Raises:
        HTTPException: For various validation and processing errors
    """
    # Validate source parameter
    pdf_processor = get_pdf_processor()
    if not pdf_processor.validate_source(source):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid source type. Must be 'linkedin' or 'resume'",
                "error_code": "INVALID_SOURCE",
                "allowed_sources": ["linkedin", "resume"],
            },
        )

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=415,
            detail={
                "message": "Please upload a PDF file",
                "error_code": "INVALID_FILE_TYPE",
                "filename": file.filename,
            },
        )

    try:
        # Process the PDF
        result = await pdf_processor.parse_pdf(file, source)

        if not result.success:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": result.error_message or "PDF processing failed",
                    "error_code": "PDF_PROCESSING_FAILED",
                },
            )

        # Return successful response
        response_data = {
            "text": result.text,
            "meta": {
                "source": result.metadata.source,
                "pages": result.metadata.pages,
                "filename": result.metadata.filename,
                "size": result.metadata.size,
                "checksum": result.metadata.checksum,
                "processed_at": result.metadata.processed_at.isoformat(),
                "blob_url": result.metadata.blob_url,
            },
            "user_id": user.uid,
            "success": True,
        }

        return JSONResponse(status_code=200, content=response_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during PDF processing",
                "error_code": "INTERNAL_ERROR",
                "details": str(e),
            },
        )


@router.get("/github/repos", response_model=PaginatedRepoResponse)
async def get_github_repos(
    username: str = Query(..., description="GitHub username"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(20, ge=1, le=100, description="Repositories per page"),
    user: UserToken = Depends(require_verified_email),
    _rate_limit: None = Depends(check_github_api_rate_limit),
) -> PaginatedRepoResponse:
    """
    Fetch GitHub repositories for a user with pagination.

    This endpoint retrieves public repositories for a given GitHub username
    with pagination support for the repository selection interface.

    Args:
        username: GitHub username to fetch repositories for
        page: Page number (1-based)
        per_page: Number of repositories per page (1-100)
        user: Authenticated user with verified email
        _rate_limit: Rate limiting dependency

    Returns:
        PaginatedRepoResponse with repository data

    Raises:
        HTTPException: For various GitHub API errors
    """
    try:
        github_service = get_github_service()
        result = await github_service.fetch_user_repos(
            username=username, page=page, per_page=per_page
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during GitHub API call",
                "error_code": "INTERNAL_ERROR",
                "details": str(e),
            },
        )


@router.post("/github/import", response_model=GitHubImportResponse)
async def import_github_repos(
    request: GitHubImportRequest, user: UserToken = Depends(require_verified_email)
) -> GitHubImportResponse:
    """
    Import selected GitHub repositories for portfolio inclusion.

    This endpoint accepts a list of repository IDs and imports them
    for the authenticated user's portfolio.

    Args:
        request: Repository import request with repo IDs
        user: Authenticated user with verified email

    Returns:
        GitHubImportResponse with import results

    Raises:
        HTTPException: For validation errors or import failures
    """
    try:
        github_service = get_github_service()
        result = await github_service.import_repositories(request.repo_ids)

        # TODO: Associate imported repositories with user in database
        # This would typically involve:
        # 1. Storing the repository IDs with the user's profile
        # 2. Potentially fetching additional repository details
        # 3. Updating the user's portfolio data

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during repository import",
                "error_code": "INTERNAL_ERROR",
                "details": str(e),
            },
        )


@router.get("/upload/config")
async def get_upload_config(user: UserToken = Depends(require_verified_email)) -> dict:
    """
    Get upload configuration for the frontend.

    This endpoint returns configuration values needed by the frontend
    for file validation and UI display.

    Args:
        user: Authenticated user with verified email

    Returns:
        Dictionary with upload configuration
    """
    return {
        "max_file_size_mb": settings.upload.MAX_FILE_SIZE_MB,
        "allowed_file_types": settings.upload.ALLOWED_FILE_TYPES,
        "max_github_repos": settings.upload.MAX_GITHUB_REPOS,
        "github_repos_per_page": settings.upload.GITHUB_REPOS_PER_PAGE,
        "rate_limits": {
            "pdf_uploads_per_hour": settings.upload.RATE_LIMIT_PDF_UPLOADS_PER_HOUR,
            "github_requests_per_hour": settings.upload.RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR,
        },
    }


@router.get("/upload/health")
async def upload_health_check() -> dict:
    """
    Health check endpoint for upload services.

    Returns:
        Dictionary with service health status
    """
    try:
        # Test PDF processor
        pdf_processor = get_pdf_processor()
        pdf_healthy = pdf_processor is not None

        # Test GitHub service
        github_service = get_github_service()
        github_healthy = github_service is not None

        # Get GitHub rate limit info if possible
        github_rate_limit = None
        try:
            github_rate_limit = await github_service.get_rate_limit_info()
        except Exception:
            pass

        return {
            "status": "healthy" if pdf_healthy and github_healthy else "degraded",
            "services": {
                "pdf_processor": "healthy" if pdf_healthy else "unhealthy",
                "github_service": "healthy" if github_healthy else "unhealthy",
            },
            "github_rate_limit": github_rate_limit,
            "config": {
                "max_file_size_mb": settings.upload.MAX_FILE_SIZE_MB,
                "max_github_repos": settings.upload.MAX_GITHUB_REPOS,
            },
        }

    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
