"""
Deployment service for storing user Vercel deployments.
"""

from datetime import datetime
import logging

import firebase_admin
from firebase_admin import firestore

from ..core.firebase import initialize_firebase

logger = logging.getLogger(__name__)


class DeploymentServiceError(Exception):
    """Custom exception for deployment service operations."""

    pass


class DeploymentService:
    """Service for storing deployment information in Firestore."""

    def __init__(self):
        self._db = None

    @property
    def db(self):
        """Lazy initialization of Firestore client."""
        if self._db is None:
            self._initialize_firebase()
        return self._db

    def _initialize_firebase(self):
        """Initialize Firebase Firestore client."""
        try:
            if not firebase_admin._apps:
                initialize_firebase()

            self._db = firestore.client()
            logger.info("Firebase Firestore client initialized for deployments")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase for deployments: {e}")
            raise DeploymentServiceError(f"Firebase initialization failed: {e}")

    def save_deployment(
        self,
        user_id: str,
        deployed_url: str,
        deployment_dashboard_url: str | None = None,
        project_dashboard_url: str | None = None,
        project_name: str | None = None,
        repository_url: str | None = None,
    ) -> None:
        """
        Save a deployment record for a user.

        Args:
            user_id: Firebase user ID
            deployed_url: The Vercel deployment URL (live site)
            deployment_dashboard_url: Vercel deployment dashboard URL
            project_dashboard_url: Vercel project dashboard URL
            project_name: Vercel project name
            repository_url: GitHub repository URL
        """
        try:
            doc_ref = self.db.collection("deployments").document(user_id)

            deployment_data = {
                "deployed_url": deployed_url,
                "deployed_at": datetime.utcnow(),
                "user_id": user_id,
            }

            # Add optional fields if provided
            if deployment_dashboard_url:
                deployment_data["deployment_dashboard_url"] = deployment_dashboard_url
            if project_dashboard_url:
                deployment_data["project_dashboard_url"] = project_dashboard_url
            if project_name:
                deployment_data["project_name"] = project_name
            if repository_url:
                deployment_data["repository_url"] = repository_url

            # Use set with merge to update or create
            doc_ref.set(deployment_data, merge=True)

            logger.info(f"Saved deployment for user {user_id}: {deployed_url}")

        except Exception as e:
            logger.error(f"Error saving deployment for user {user_id}: {e}")
            raise DeploymentServiceError(f"Failed to save deployment: {e}")


_deployment_service = None


def get_deployment_service() -> DeploymentService:
    """Get the singleton deployment service instance."""
    global _deployment_service
    if _deployment_service is None:
        _deployment_service = DeploymentService()
    return _deployment_service
