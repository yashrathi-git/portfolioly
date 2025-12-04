"""
Resume API routes for managing user resumes.

Provides CRUD operations for resumes stored in Firebase.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..dependencies.rate_limiting import rate_limited_core_user
from ..schemas.auth import UserToken
from ..schemas.resume import (
    ResumeData,
    ResumeSummary,
    CreateResumeRequest,
    UpdateResumeRequest,
    ResumeListResponse,
)
from ..services.resume_service import (
    get_resume_service,
    ResumeServiceError,
    ResumeNotFoundError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resumes", tags=["resumes"])


class CreateResumeResponse(BaseModel):
    """Response for resume creation."""

    id: str
    message: str


class DuplicateResumeRequest(BaseModel):
    """Request for duplicating a resume."""

    new_name: Optional[str] = None


class DuplicateResumeResponse(BaseModel):
    """Response for resume duplication."""

    id: str
    message: str


class DeleteResumeResponse(BaseModel):
    """Response for resume deletion."""

    success: bool
    message: str


@router.post("/", response_model=CreateResumeResponse)
def create_resume(
    request: CreateResumeRequest,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Create a new resume.

    Creates a new resume with a unique ID and stores it in the user's
    resume collection.
    """
    try:
        resume_service = get_resume_service()
        resume_id = resume_service.create_resume(user.uid, request)
        return CreateResumeResponse(id=resume_id, message="Resume created successfully")
    except ResumeServiceError as e:
        logger.error(f"Failed to create resume for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create resume")
    except Exception as e:
        logger.error(f"Unexpected error creating resume for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=ResumeListResponse)
def list_resumes(
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    List all resumes for the current user.

    Returns a list of resume summaries with names and timestamps.
    """
    try:
        resume_service = get_resume_service()
        summaries = resume_service.list_resumes(user.uid)
        return ResumeListResponse(resumes=summaries, total=len(summaries))
    except ResumeServiceError as e:
        logger.error(f"Failed to list resumes for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to list resumes")
    except Exception as e:
        logger.error(f"Unexpected error listing resumes for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{resume_id}", response_model=ResumeData)
def get_resume(
    resume_id: str,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Get a single resume by ID.

    Returns the full resume data for the specified resume.
    """
    try:
        resume_service = get_resume_service()
        resume = resume_service.get_resume(user.uid, resume_id)
        return resume
    except ResumeNotFoundError:
        raise HTTPException(status_code=404, detail="Resume not found")
    except ResumeServiceError as e:
        logger.error(f"Failed to get resume {resume_id} for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve resume")
    except Exception as e:
        logger.error(
            f"Unexpected error getting resume {resume_id} for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{resume_id}", response_model=dict)
def update_resume(
    resume_id: str,
    request: UpdateResumeRequest,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Update an existing resume.

    Updates the specified fields of the resume. Only provided fields
    will be updated; others remain unchanged.
    """
    try:
        resume_service = get_resume_service()
        resume_service.update_resume(user.uid, resume_id, request)
        return {"message": "Resume updated successfully"}
    except ResumeNotFoundError:
        raise HTTPException(status_code=404, detail="Resume not found")
    except ResumeServiceError as e:
        logger.error(f"Failed to update resume {resume_id} for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update resume")
    except Exception as e:
        logger.error(
            f"Unexpected error updating resume {resume_id} for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{resume_id}", response_model=DeleteResumeResponse)
def delete_resume(
    resume_id: str,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Delete a resume.

    Permanently removes the resume from the user's collection.
    """
    try:
        resume_service = get_resume_service()
        resume_service.delete_resume(user.uid, resume_id)
        return DeleteResumeResponse(success=True, message="Resume deleted successfully")
    except ResumeNotFoundError:
        raise HTTPException(status_code=404, detail="Resume not found")
    except ResumeServiceError as e:
        logger.error(f"Failed to delete resume {resume_id} for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete resume")
    except Exception as e:
        logger.error(
            f"Unexpected error deleting resume {resume_id} for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{resume_id}/duplicate", response_model=DuplicateResumeResponse)
def duplicate_resume(
    resume_id: str,
    request: DuplicateResumeRequest = None,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Duplicate an existing resume.

    Creates a copy of the resume with a new ID. Optionally provide
    a new name for the copy.
    """
    try:
        resume_service = get_resume_service()
        new_name = request.new_name if request else None
        new_id = resume_service.duplicate_resume(user.uid, resume_id, new_name)
        return DuplicateResumeResponse(
            id=new_id, message="Resume duplicated successfully"
        )
    except ResumeNotFoundError:
        raise HTTPException(status_code=404, detail="Resume not found")
    except ResumeServiceError as e:
        logger.error(f"Failed to duplicate resume {resume_id} for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to duplicate resume")
    except Exception as e:
        logger.error(
            f"Unexpected error duplicating resume {resume_id} for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")
