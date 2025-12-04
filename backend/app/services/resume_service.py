"""
Resume service for Firebase data persistence.

This service handles storing and retrieving resume data in Firestore,
supporting multiple resumes per user with CRUD operations.
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore

from ..core.config import settings
from ..schemas.resume import (
    ResumeData,
    ResumeSummary,
    CreateResumeRequest,
    UpdateResumeRequest,
    DEFAULT_SECTION_ORDER,
    ResumeSkills,
)

logger = logging.getLogger(__name__)


class ResumeServiceError(Exception):
    """Custom exception for Resume service operations."""

    pass


class ResumeNotFoundError(ResumeServiceError):
    """Exception raised when a resume is not found."""

    pass


class ResumeService:
    """Service for resume data persistence."""

    COLLECTION_PATH = "users/{user_id}/resumes"

    def __init__(self):
        """Initialize the resume service with Firebase connection."""
        self._db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized."""
        try:
            firebase_admin.get_app()
            logger.info("Firebase already initialized for ResumeService")
        except ValueError:
            if settings.google_application_credentials:
                cred = credentials.Certificate(settings.google_application_credentials)
                firebase_admin.initialize_app(
                    cred, {"projectId": settings.firebase_project_id}
                )
                logger.info("Firebase initialized with service account")
            else:
                firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")

        self._db = firestore.client()
        logger.info("Firestore client initialized for ResumeService")

    @property
    def db(self):
        """Get Firestore database client."""
        if self._db is None:
            self._initialize_firebase()
        return self._db

    def _get_resumes_collection(self, user_id: str):
        """Get the resumes collection reference for a user."""
        return self.db.collection("users").document(user_id).collection("resumes")

    def _generate_resume_id(self) -> str:
        """Generate a unique resume ID."""
        return f"resume_{uuid.uuid4().hex[:12]}"

    def create_resume(self, user_id: str, request: CreateResumeRequest) -> str:
        """
        Create a new resume for a user.

        Args:
            user_id: User ID to create resume for
            request: Resume creation request data

        Returns:
            str: The generated resume ID

        Raises:
            ResumeServiceError: If creation fails
        """
        try:
            resume_id = self._generate_resume_id()
            now = datetime.utcnow()

            resume_data = ResumeData(
                id=resume_id,
                name=request.name,
                template_id=request.template_id or "classic",
                section_order=request.section_order or list(DEFAULT_SECTION_ORDER),
                personal_info=request.personal_info,
                summary=request.summary,
                work_experiences=request.work_experiences or [],
                education=request.education or [],
                projects=request.projects or [],
                skills=request.skills or ResumeSkills(),
                certifications=request.certifications or [],
                created_at=now,
                updated_at=now,
            )

            # Store in Firestore
            doc_ref = self._get_resumes_collection(user_id).document(resume_id)
            doc_ref.set(resume_data.model_dump(mode="json"))

            logger.info(f"Resume created successfully: {resume_id} for user {user_id}")
            return resume_id

        except Exception as e:
            logger.error(f"Failed to create resume for user {user_id}: {str(e)}")
            raise ResumeServiceError(f"Failed to create resume: {str(e)}")

    def get_resume(self, user_id: str, resume_id: str) -> ResumeData:
        """
        Retrieve a single resume by ID.

        Args:
            user_id: User ID
            resume_id: Resume ID to retrieve

        Returns:
            ResumeData: The resume data

        Raises:
            ResumeNotFoundError: If resume doesn't exist
            ResumeServiceError: If retrieval fails
        """
        try:
            doc_ref = self._get_resumes_collection(user_id).document(resume_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.info(f"Resume not found: {resume_id} for user {user_id}")
                raise ResumeNotFoundError(f"Resume not found: {resume_id}")

            data = doc.to_dict()
            resume = ResumeData(**data)
            logger.info(f"Resume retrieved: {resume_id} for user {user_id}")
            return resume

        except ResumeNotFoundError:
            raise
        except Exception as e:
            logger.error(
                f"Failed to get resume {resume_id} for user {user_id}: {str(e)}"
            )
            raise ResumeServiceError(f"Failed to retrieve resume: {str(e)}")

    def list_resumes(self, user_id: str) -> List[ResumeSummary]:
        """
        List all resumes for a user.

        Args:
            user_id: User ID

        Returns:
            List[ResumeSummary]: List of resume summaries

        Raises:
            ResumeServiceError: If listing fails
        """
        try:
            collection_ref = self._get_resumes_collection(user_id)
            docs = collection_ref.order_by(
                "updated_at", direction=firestore.Query.DESCENDING
            ).stream()

            summaries = []
            for doc in docs:
                data = doc.to_dict()
                summary = ResumeSummary(
                    id=data.get("id", doc.id),
                    name=data.get("name", "Untitled"),
                    template_id=data.get("template_id", "classic"),
                    created_at=data.get("created_at", datetime.utcnow()),
                    updated_at=data.get("updated_at", datetime.utcnow()),
                )
                summaries.append(summary)

            logger.info(f"Listed {len(summaries)} resumes for user {user_id}")
            return summaries

        except Exception as e:
            logger.error(f"Failed to list resumes for user {user_id}: {str(e)}")
            raise ResumeServiceError(f"Failed to list resumes: {str(e)}")

    def update_resume(
        self, user_id: str, resume_id: str, request: UpdateResumeRequest
    ) -> bool:
        """
        Update an existing resume.

        Args:
            user_id: User ID
            resume_id: Resume ID to update
            request: Update request with fields to change

        Returns:
            bool: True if successful

        Raises:
            ResumeNotFoundError: If resume doesn't exist
            ResumeServiceError: If update fails
        """
        try:
            doc_ref = self._get_resumes_collection(user_id).document(resume_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.info(f"Resume not found for update: {resume_id}")
                raise ResumeNotFoundError(f"Resume not found: {resume_id}")

            # Build update dict from non-None fields
            update_data = {}
            request_dict = request.model_dump(exclude_none=True)

            for key, value in request_dict.items():
                if value is not None:
                    # Handle nested Pydantic models
                    if hasattr(value, "model_dump"):
                        update_data[key] = value.model_dump(mode="json")
                    elif isinstance(value, list):
                        update_data[key] = [
                            (
                                item.model_dump(mode="json")
                                if hasattr(item, "model_dump")
                                else item
                            )
                            for item in value
                        ]
                    else:
                        update_data[key] = value

            # Always update the timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat() + "Z"

            doc_ref.update(update_data)
            logger.info(f"Resume updated: {resume_id} for user {user_id}")
            return True

        except ResumeNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to update resume {resume_id}: {str(e)}")
            raise ResumeServiceError(f"Failed to update resume: {str(e)}")

    def delete_resume(self, user_id: str, resume_id: str) -> bool:
        """
        Delete a resume.

        Args:
            user_id: User ID
            resume_id: Resume ID to delete

        Returns:
            bool: True if successful

        Raises:
            ResumeNotFoundError: If resume doesn't exist
            ResumeServiceError: If deletion fails
        """
        try:
            doc_ref = self._get_resumes_collection(user_id).document(resume_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.info(f"Resume not found for deletion: {resume_id}")
                raise ResumeNotFoundError(f"Resume not found: {resume_id}")

            doc_ref.delete()
            logger.info(f"Resume deleted: {resume_id} for user {user_id}")
            return True

        except ResumeNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete resume {resume_id}: {str(e)}")
            raise ResumeServiceError(f"Failed to delete resume: {str(e)}")

    def duplicate_resume(
        self, user_id: str, resume_id: str, new_name: Optional[str] = None
    ) -> str:
        """
        Duplicate an existing resume.

        Args:
            user_id: User ID
            resume_id: Resume ID to duplicate
            new_name: Optional new name for the copy

        Returns:
            str: The new resume ID

        Raises:
            ResumeNotFoundError: If original resume doesn't exist
            ResumeServiceError: If duplication fails
        """
        try:
            # Get the original resume
            original = self.get_resume(user_id, resume_id)

            # Generate new ID and timestamps
            new_id = self._generate_resume_id()
            now = datetime.utcnow()

            # Create the duplicate with new ID and name
            duplicate_data = original.model_dump(mode="json")
            duplicate_data["id"] = new_id
            duplicate_data["name"] = new_name or f"{original.name} (Copy)"
            duplicate_data["created_at"] = now.isoformat() + "Z"
            duplicate_data["updated_at"] = now.isoformat() + "Z"

            # Store the duplicate
            doc_ref = self._get_resumes_collection(user_id).document(new_id)
            doc_ref.set(duplicate_data)

            logger.info(
                f"Resume duplicated: {resume_id} -> {new_id} for user {user_id}"
            )
            return new_id

        except ResumeNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to duplicate resume {resume_id}: {str(e)}")
            raise ResumeServiceError(f"Failed to duplicate resume: {str(e)}")


# Global service instance
_resume_service: Optional[ResumeService] = None


def get_resume_service() -> ResumeService:
    """Get or create the global resume service instance."""
    global _resume_service
    if _resume_service is None:
        _resume_service = ResumeService()
    return _resume_service
