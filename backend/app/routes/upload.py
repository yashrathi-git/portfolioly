"""
Upload API routes for onboarding flow.

This module provides API endpoints for PDF upload and GitHub integration
functionality in the upload onboarding flow.
"""

import logging
from typing import Literal
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Query,
    Depends,
    HTTPException,
    BackgroundTasks,
)
from fastapi.responses import JSONResponse

from ..auth.middleware import require_verified_email
from ..schemas.auth import UserToken
from ..schemas.github import PaginatedRepoResponse
from ..schemas.upload import UploadSubmissionRequest, UploadSubmissionResponse
from ..services.pdf_processor import get_pdf_processor
from ..services.github_service import get_github_service
from ..services.portfolio_service import get_portfolio_service
from ..services.azure_blob_storage import get_azure_blob_storage_service
from ..services.upload_processor import get_upload_processor
from ..dependencies.rate_limiting import (
    check_pdf_upload_rate_limit,
    check_github_api_rate_limit,
    rate_limited_core_user,
    limit_healthcheck_requests,
)
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/ingest/pdf", response_model=dict)
async def upload_pdf(
    background_tasks: BackgroundTasks,
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
    logger.info(
        "PDF upload request received",
        extra={"user_id": user.uid, "source": source, "file_name": file.filename},
    )

    # Validate source parameter
    pdf_processor = get_pdf_processor()
    if not pdf_processor.validate_source(source):
        logger.warning(
            "Invalid source type",
            extra={"user_id": user.uid, "source": source},
        )
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
        logger.warning(
            "Invalid file type",
            extra={"user_id": user.uid, "file_name": file.filename},
        )
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
            logger.error(
                "PDF processing failed",
                extra={
                    "user_id": user.uid,
                    "source": source,
                    "error": result.error_message,
                },
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "message": result.error_message or "PDF processing failed",
                    "error_code": "PDF_PROCESSING_FAILED",
                },
            )

        logger.info(
            "PDF processed successfully",
            extra={
                "user_id": user.uid,
                "source": source,
                "pages": result.metadata.pages,
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
            },
            "user_id": user.uid,
            "success": True,
        }

        async def _persist_pdf_to_azure(
            user_id: str,
            source_type: str,
            file_bytes: bytes,
            filename: str,
            checksum: str,
        ) -> None:
            try:
                azure_storage = get_azure_blob_storage_service()
                blob_url = await azure_storage.upload_user_pdf_from_bytes(
                    user_id=user_id,
                    source=source_type,
                    file_bytes=file_bytes,
                    filename=filename,
                )
                if blob_url:
                    portfolio_service = get_portfolio_service()
                    portfolio_service.record_user_pdf_reference(
                        user_id,
                        source=source_type,
                        blob_url=blob_url,
                        filename=filename,
                        checksum=checksum,
                    )
                    logger.info(
                        "PDF uploaded to Azure storage",
                        extra={"user_id": user_id, "source": source_type},
                    )
            except Exception as background_error:
                logger.warning(
                    "Failed to upload PDF to Azure storage",
                    extra={
                        "user_id": user_id,
                        "source": source_type,
                        "error": str(background_error),
                    },
                )

        file_bytes: bytes = b""
        try:
            await file.seek(0)
            file_bytes = await file.read()
        except Exception:
            logger.warning(
                "Failed to buffer file bytes for Azure upload background task",
                extra={"user_id": user.uid, "source": source},
            )
            file_bytes = b""
        finally:
            try:
                await file.close()
            except Exception:
                logger.debug(
                    "Failed to close uploaded file after buffering",
                    extra={"user_id": user.uid, "source": source},
                )

        if file_bytes:
            background_tasks.add_task(
                _persist_pdf_to_azure,
                user.uid,
                source,
                file_bytes,
                result.metadata.filename,
                result.metadata.checksum,
            )

        return JSONResponse(status_code=200, content=response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Unexpected error during PDF processing",
            extra={"user_id": user.uid, "source": source},
        )
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
    logger.info(
        "GitHub repos request received",
        extra={"user_id": user.uid, "username": username, "page": page},
    )

    try:
        github_service = get_github_service()
        result = await github_service.fetch_user_repos(
            username=username, page=page, per_page=per_page
        )

        logger.info(
            "GitHub repos fetched successfully",
            extra={
                "user_id": user.uid,
                "username": username,
                "repos_count": len(result.repos),
            },
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Unexpected error during GitHub API call",
            extra={"user_id": user.uid, "username": username},
        )
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
    request: UploadSubmissionRequest,
    background_tasks: BackgroundTasks,
    user: UserToken = Depends(rate_limited_core_user),
) -> UploadSubmissionResponse:
    """
    Submit complete upload data including PDFs and GitHub repositories.

    This endpoint accepts all the upload data from the onboarding flow
    and processes it for the user's portfolio.

    Processing Path Logic:
    1. If resume PDF present -> AI processing (existing path)
    2. If only LinkedIn markdown + GitHub -> Direct extraction (new path)
    3. If only GitHub -> GitHub-only mapping (existing path)
    4. If only LinkedIn markdown -> Direct extraction (new path)

    Args:
        request: Complete upload submission data
        user: Authenticated user with verified email
        background_tasks: FastAPI background tasks

    Returns:
        Success response with submission details

    Raises:
        HTTPException: For validation errors or processing failures
    """
    try:
        # Get services
        portfolio_service = get_portfolio_service()
        upload_processor = get_upload_processor(portfolio_service)

        # Process the submission
        return await upload_processor.process_submission(
            request, user, background_tasks
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Unexpected error during upload submission",
            extra={"user_id": user.uid},
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during upload submission",
                "error_code": "INTERNAL_ERROR",
                "details": str(e),
            },
        )


@router.get("/upload/config")
async def get_upload_config(user: UserToken = Depends(rate_limited_core_user)) -> dict:
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
async def upload_health_check(
    _rate_limit: None = Depends(limit_healthcheck_requests),
) -> dict:
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
