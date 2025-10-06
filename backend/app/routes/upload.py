"""
Upload API routes for onboarding flow.

This module provides API endpoints for PDF upload and GitHub integration
functionality in the upload onboarding flow.
"""

from typing import Literal, List, Optional
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Query, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..auth.middleware import require_verified_email
from ..schemas.auth import UserToken
from ..schemas.pdf import PDFParseResult
from ..schemas.github import PaginatedRepoResponse
from ..schemas.upload import (
    GitHubRepoData,
    PDFData,
    UploadSubmissionRequest,
    UploadSubmissionResponse,
)
from ..services.pdf_processor import get_pdf_processor
from ..services.github_service import get_github_service
from ..services.portfolio_service import get_portfolio_service
from ..services.ai_processor import (
    get_ai_processor,
    AIProcessingError,
    TokenLimitExceededError,
)
from ..dependencies.rate_limiting import (
    check_pdf_upload_rate_limit,
    check_github_api_rate_limit,
)
from ..services.ai_rate_limiter import get_ai_rate_limiter, AIRateLimitError
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


@router.post("/submit", response_model=UploadSubmissionResponse)
async def submit_upload_data(
    request: UploadSubmissionRequest, user: UserToken = Depends(require_verified_email)
) -> UploadSubmissionResponse:
    """
    Submit complete upload data including PDFs and GitHub repositories.

    This endpoint accepts all the upload data from the onboarding flow
    and processes it for the user's portfolio.

    Args:
        request: Complete upload submission data
        user: Authenticated user with verified email

    Returns:
        Success response with submission details

    Raises:
        HTTPException: For validation errors or processing failures
    """
    try:
        # Log the received data
        print(f"[UPLOAD SUBMISSION] User: {user.uid}")
        print(
            f"[UPLOAD SUBMISSION] LinkedIn PDF: {'Yes' if request.linkedin_pdf else 'No'}"
        )
        print(
            f"[UPLOAD SUBMISSION] Resume PDF: {'Yes' if request.resume_pdf else 'No'}"
        )
        print(f"[UPLOAD SUBMISSION] GitHub Repos: {len(request.github_repos)}")

        # Get services
        portfolio_service = get_portfolio_service()

        # Determine processing path
        has_pdf_data = (
            request.linkedin_pdf is not None or request.resume_pdf is not None
        )

        if has_pdf_data:
            # Path 1: PDF data present - use AI processing
            try:
                # Check AI processing rate limit
                ai_rate_limiter = get_ai_rate_limiter()
                rate_limit_info = ai_rate_limiter.check_rate_limit(user.uid)

                ai_processor = get_ai_processor()

                # Process with AI
                portfolio_data = ai_processor.process_portfolio_data(
                    resume_pdf=request.resume_pdf,
                    linkedin_pdf=request.linkedin_pdf,
                    github_repos=request.github_repos,
                )

                # Store in Firebase
                success = portfolio_service.store_portfolio_data(
                    user.uid, portfolio_data
                )

                if success:
                    # Increment AI usage counter
                    ai_rate_limiter.increment_usage(user.uid)

                    return UploadSubmissionResponse(
                        success=True,
                        message="Portfolio data processed and stored successfully using AI extraction",
                        data={
                            "user_id": user.uid,
                            "processing_type": "ai_extraction",
                            "linkedin_pdf_submitted": request.linkedin_pdf is not None,
                            "resume_pdf_submitted": request.resume_pdf is not None,
                            "github_repos_count": len(request.github_repos),
                            "submitted_at": datetime.utcnow().isoformat() + "Z",
                        },
                    )
                else:
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "message": "Failed to store portfolio data",
                            "error_code": "STORAGE_FAILED",
                        },
                    )

            except AIRateLimitError as e:
                # Rate limit exceeded - return error
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": str(e),
                        "error_code": "AI_RATE_LIMIT_EXCEEDED",
                        "monthly_limit": 10,
                        "reset_info": "Limit resets on the first day of each month",
                    },
                )
            except (AIProcessingError, TokenLimitExceededError) as e:
                # AI processing failed - proceed to placeholder screen
                print(f"[AI PROCESSING FAILED] {str(e)}")
                return UploadSubmissionResponse(
                    success=False,  # Still success, but with placeholder
                    message="AI services unavailable, please try again later.",
                    data={
                        "user_id": user.uid,
                        "processing_type": "placeholder",
                        "ai_processing_failed": True,
                        "error_message": "AI processing temporarily unavailable",
                        "linkedin_pdf_submitted": request.linkedin_pdf is not None,
                        "resume_pdf_submitted": request.resume_pdf is not None,
                        "github_repos_count": len(request.github_repos),
                        "submitted_at": datetime.utcnow().isoformat() + "Z",
                    },
                )
        else:
            # Path 2: GitHub-only data - direct mapping
            if request.github_repos:
                portfolio_data = portfolio_service.map_github_only_data(
                    request.github_repos
                )

                # Store in Firebase
                success = portfolio_service.store_portfolio_data(
                    user.uid, portfolio_data
                )

                if success:
                    return UploadSubmissionResponse(
                        success=True,
                        message="GitHub repository data processed and stored successfully",
                        data={
                            "user_id": user.uid,
                            "processing_type": "github_only",
                            "linkedin_pdf_submitted": False,
                            "resume_pdf_submitted": False,
                            "github_repos_count": len(request.github_repos),
                            "submitted_at": datetime.utcnow().isoformat() + "Z",
                        },
                    )
                else:
                    raise HTTPException(
                        status_code=500,
                        detail={
                            "message": "Failed to store GitHub data",
                            "error_code": "STORAGE_FAILED",
                        },
                    )
            else:
                # No data provided
                return UploadSubmissionResponse(
                    success=True,
                    message="No data provided for processing",
                    data={
                        "user_id": user.uid,
                        "processing_type": "no_data",
                        "linkedin_pdf_submitted": False,
                        "resume_pdf_submitted": False,
                        "github_repos_count": 0,
                        "submitted_at": datetime.utcnow().isoformat() + "Z",
                    },
                )

    except Exception as e:
        print(f"[UPLOAD SUBMISSION ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during upload submission",
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
