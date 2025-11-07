"""
Upload processing service for handling different data source combinations.

This module contains the business logic for processing portfolio data from
various sources (LinkedIn PDFs, resume PDFs, GitHub repos) using different
processing strategies.
"""

import logging
from datetime import datetime
from typing import Optional, List
from fastapi import BackgroundTasks, HTTPException
from fastapi.concurrency import run_in_threadpool

from ..schemas.auth import UserToken
from ..schemas.upload import UploadSubmissionRequest, UploadSubmissionResponse
from ..schemas.github import GitHubRepo
from .ai_processor import get_ai_processor, AIProcessingError, TokenLimitExceededError
from .ai_rate_limiter import get_ai_rate_limiter, AIRateLimitError
from .linkedin_extractor import get_linkedin_extractor
from .brandfetch_service import enrich_portfolio_logos

logger = logging.getLogger(__name__)


class UploadProcessor:
    """Handles processing of upload submissions with different data sources."""

    def __init__(self, portfolio_service):
        self.portfolio_service = portfolio_service

    async def process_submission(
        self,
        request: UploadSubmissionRequest,
        user: UserToken,
        background_tasks: BackgroundTasks,
    ) -> UploadSubmissionResponse:
        """
        Process upload submission and route to appropriate processing strategy.

        Processing Path Logic:
        1. If resume PDF present -> AI processing
        2. If only LinkedIn markdown + GitHub -> Direct extraction
        3. If only GitHub -> GitHub-only mapping
        4. If only LinkedIn markdown -> Direct extraction

        Args:
            request: Complete upload submission data
            user: Authenticated user
            background_tasks: FastAPI background tasks

        Returns:
            UploadSubmissionResponse with processing results
        """
        has_linkedin_pdf = request.linkedin_pdf is not None
        has_resume_pdf = request.resume_pdf is not None
        has_github_repos = len(request.github_repos) > 0

        logger.info(
            "Processing upload submission",
            extra={
                "user_id": user.uid,
                "linkedin_pdf": has_linkedin_pdf,
                "resume_pdf": has_resume_pdf,
                "github_repos_count": len(request.github_repos),
            },
        )

        if has_resume_pdf:
            logger.info(
                "Routing to AI processing (resume PDF present)",
                extra={"user_id": user.uid},
            )
            return await self._process_with_ai(request, user, background_tasks)

        elif has_linkedin_pdf:
            logger.info(
                "Routing to direct extraction (LinkedIn PDF without resume)",
                extra={"user_id": user.uid, "github_repos_included": has_github_repos},
            )
            return await self._process_with_direct_extraction(
                request, user, background_tasks
            )

        elif has_github_repos:
            logger.info("Routing to GitHub-only mapping", extra={"user_id": user.uid})
            return await self._process_github_only(request, user)

        else:
            logger.info("No data sources provided", extra={"user_id": user.uid})
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

    async def _process_with_ai(
        self,
        request: UploadSubmissionRequest,
        user: UserToken,
        background_tasks: BackgroundTasks,
    ) -> UploadSubmissionResponse:
        """Process with AI extraction (resume PDF present)."""
        logger.info(
            "Starting AI processing",
            extra={
                "user_id": user.uid,
                "linkedin_pdf": request.linkedin_pdf is not None,
                "resume_pdf": request.resume_pdf is not None,
                "github_repos_count": len(request.github_repos),
            },
        )

        try:
            # Check AI processing rate limit
            ai_rate_limiter = get_ai_rate_limiter()
            _rate_limit_info = await run_in_threadpool(
                ai_rate_limiter.check_rate_limit, user.uid
            )

            ai_processor = get_ai_processor()

            # Process with AI
            portfolio_data = await ai_processor.process_portfolio_data(
                resume_pdf=request.resume_pdf,
                linkedin_pdf=request.linkedin_pdf,
                github_repos=request.github_repos,
            )

            # Store in Firebase
            success = await run_in_threadpool(
                self.portfolio_service.store_portfolio_data,
                user.uid,
                portfolio_data,
            )

            if success:
                # Increment AI usage counter
                background_tasks.add_task(ai_rate_limiter.increment_usage, user.uid)
                background_tasks.add_task(
                    enrich_portfolio_logos,
                    user.uid,
                    portfolio_data.model_dump(mode="json"),
                )

                logger.info(
                    "AI processing completed successfully", extra={"user_id": user.uid}
                )

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
                logger.error(
                    "Failed to store portfolio data", extra={"user_id": user.uid}
                )
                raise HTTPException(
                    status_code=500,
                    detail={
                        "message": "Failed to store portfolio data",
                        "error_code": "STORAGE_FAILED",
                    },
                )

        except AIRateLimitError as e:
            logger.warning(
                "AI rate limit exceeded", extra={"user_id": user.uid, "error": str(e)}
            )
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
            logger.error(
                "AI processing failed", extra={"user_id": user.uid, "error": str(e)}
            )
            return UploadSubmissionResponse(
                success=False,
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

    async def _process_with_direct_extraction(
        self,
        request: UploadSubmissionRequest,
        user: UserToken,
        background_tasks: BackgroundTasks,
    ) -> UploadSubmissionResponse:
        """Process LinkedIn markdown with direct extraction (no AI)."""
        logger.info(
            "Starting direct extraction",
            extra={
                "user_id": user.uid,
                "github_repos_count": len(request.github_repos),
            },
        )

        try:
            # Get LinkedIn extractor service
            linkedin_extractor = get_linkedin_extractor()

            # Extract markdown text from PDFData object
            linkedin_markdown = request.linkedin_pdf.text

            # Convert GitHubRepoData to GitHubRepo schema if needed
            github_repos = self._convert_github_repos(request.github_repos)

            # Extract portfolio data from LinkedIn markdown
            portfolio_data = await linkedin_extractor.extract_from_markdown(
                markdown_text=linkedin_markdown,
                github_repos=github_repos,
            )

            # Store in Firebase
            success = await run_in_threadpool(
                self.portfolio_service.store_portfolio_data,
                user.uid,
                portfolio_data,
            )

            if success:
                # Enrich logos in background
                background_tasks.add_task(
                    enrich_portfolio_logos,
                    user.uid,
                    portfolio_data.model_dump(mode="json"),
                )

                logger.info(
                    "Direct extraction completed successfully",
                    extra={"user_id": user.uid},
                )

                return UploadSubmissionResponse(
                    success=True,
                    message="Portfolio data processed and stored successfully using direct extraction",
                    data={
                        "user_id": user.uid,
                        "processing_type": "direct_extraction",
                        "linkedin_pdf_submitted": True,
                        "resume_pdf_submitted": False,
                        "github_repos_count": len(request.github_repos),
                        "submitted_at": datetime.utcnow().isoformat() + "Z",
                    },
                )
            else:
                logger.error(
                    "Failed to store portfolio data", extra={"user_id": user.uid}
                )
                raise HTTPException(
                    status_code=500,
                    detail={
                        "message": "Failed to store portfolio data",
                        "error_code": "STORAGE_FAILED",
                    },
                )

        except ValueError as e:
            logger.error(
                "Direct extraction failed", extra={"user_id": user.uid, "error": str(e)}
            )
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Failed to extract data from LinkedIn PDF",
                    "error_code": "EXTRACTION_FAILED",
                    "details": str(e),
                },
            )

    async def _process_github_only(
        self,
        request: UploadSubmissionRequest,
        user: UserToken,
    ) -> UploadSubmissionResponse:
        """Process GitHub-only data with direct mapping."""
        logger.info(
            "Starting GitHub-only processing",
            extra={
                "user_id": user.uid,
                "github_repos_count": len(request.github_repos),
            },
        )

        portfolio_data = await run_in_threadpool(
            self.portfolio_service.map_github_only_data,
            request.github_repos,
        )

        # Store in Firebase
        success = await run_in_threadpool(
            self.portfolio_service.store_portfolio_data,
            user.uid,
            portfolio_data,
        )

        if success:
            logger.info(
                "GitHub-only processing completed successfully",
                extra={"user_id": user.uid},
            )
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
            logger.error("Failed to store GitHub data", extra={"user_id": user.uid})
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Failed to store GitHub data",
                    "error_code": "STORAGE_FAILED",
                },
            )

    def _convert_github_repos(self, repo_data_list) -> Optional[List[GitHubRepo]]:
        """Convert GitHubRepoData to GitHubRepo schema."""
        if not repo_data_list:
            return None

        return [
            GitHubRepo(
                id=repo.id,
                name=repo.name,
                description=repo.description,
                stars=repo.stars,
                url=repo.url,
                language=repo.language,
                fork=repo.fork,
                private=repo.private,
                created_at=repo.created_at,
                updated_at=repo.updated_at,
            )
            for repo in repo_data_list
        ]


def get_upload_processor(portfolio_service):
    """Factory function to create UploadProcessor instance."""
    return UploadProcessor(portfolio_service)
