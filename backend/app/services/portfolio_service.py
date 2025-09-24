"""
Portfolio service for Firebase data persistence and GitHub mapping.

This service handles storing and retrieving portfolio data in Firestore,
as well as direct mapping of GitHub-only data to the portfolio schema.
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from ..core.config import settings
from ..schemas.portfolio import PortfolioData, PersonalInfo, Project, PortfolioMetadata
from ..schemas.upload import GitHubRepoData

logger = logging.getLogger(__name__)


class FirebaseError(Exception):
    """Custom exception for Firebase operations."""

    pass


class PortfolioService:
    """Service for portfolio data persistence and GitHub mapping."""

    def __init__(self):
        """Initialize the portfolio service with Firebase connection."""
        self._db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized."""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            logger.info("Firebase already initialized")
        except ValueError:
            # Initialize Firebase
            if settings.google_application_credentials:
                cred = credentials.Certificate(settings.google_application_credentials)
                firebase_admin.initialize_app(
                    cred, {"projectId": settings.firebase_project_id}
                )
                logger.info("Firebase initialized with service account")
            else:
                # Use default credentials (for local development or cloud environments)
                firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")

        # Get Firestore client
        self._db = firestore.client()
        logger.info("Firestore client initialized")

    @property
    def db(self):
        """Get Firestore database client."""
        if self._db is None:
            self._initialize_firebase()
        return self._db

    def store_portfolio_data(self, user_id: str, portfolio_data: PortfolioData) -> bool:
        """
        Store portfolio data in Firestore.

        Args:
            user_id: User ID to store data for
            portfolio_data: Portfolio data to store

        Returns:
            bool: True if successful, False otherwise

        Raises:
            FirebaseError: If storage operation fails
        """
        try:
            # Convert to dict for Firestore storage
            data_dict = portfolio_data.model_dump()

            # Add timestamp
            data_dict["updated_at"] = datetime.utcnow()

            # Store in Firestore at portfolios/{userId}
            doc_ref = self.db.collection("portfolios").document(user_id)
            doc_ref.set(data_dict)

            logger.info(f"Portfolio data stored successfully for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store portfolio data for user {user_id}: {str(e)}")
            raise FirebaseError(f"Failed to store portfolio data: {str(e)}")

    def get_portfolio_data(self, user_id: str) -> Optional[PortfolioData]:
        """
        Retrieve portfolio data from Firestore.

        Args:
            user_id: User ID to retrieve data for

        Returns:
            PortfolioData or None if not found

        Raises:
            FirebaseError: If retrieval operation fails
        """
        try:
            doc_ref = self.db.collection("portfolios").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                # Remove Firestore-specific fields
                data.pop("updated_at", None)

                # Convert back to PortfolioData
                portfolio_data = PortfolioData(**data)
                logger.info(f"Portfolio data retrieved successfully for user {user_id}")
                return portfolio_data
            else:
                logger.info(f"No portfolio data found for user {user_id}")
                return None

        except Exception as e:
            logger.error(
                f"Failed to retrieve portfolio data for user {user_id}: {str(e)}"
            )
            raise FirebaseError(f"Failed to retrieve portfolio data: {str(e)}")

    def map_github_only_data(self, github_repos: List[GitHubRepoData]) -> PortfolioData:
        """
        Map GitHub repository data directly to PortfolioData schema.

        This method handles the case where only GitHub data is provided
        (no PDF processing needed).

        Args:
            github_repos: List of GitHub repository data

        Returns:
            PortfolioData: Mapped portfolio data with projects from GitHub
        """
        try:
            # Create projects from GitHub repositories
            projects = []
            all_technologies = set()

            for repo in github_repos:
                # Extract technologies from repository language
                technologies = []
                if repo.language:
                    technologies.append(repo.language)

                # Add to all technologies set
                all_technologies.update(technologies)

                # Create highlights list, filtering out None values
                highlights = []
                if repo.stars > 0:
                    highlights.append(f"⭐ {repo.stars} stars")
                if repo.description:
                    highlights.append(repo.description)

                # Create project entry
                project = Project(
                    name=repo.name,
                    role="Developer",  # Default role
                    highlights=highlights,
                    technologies=technologies,
                    github=repo.url,
                    live_link=None,  # GitHubRepoData doesn't have homepage field
                    more_context=f"GitHub repository with {repo.stars} stars",
                )

                projects.append(project)

            # Create basic personal info (will be empty but structured)
            personal_info = PersonalInfo()

            # Create metadata
            metadata = PortfolioMetadata(
                source_type="github_only",
                extracted_at=datetime.utcnow(),
                notes=f"Mapped from {len(github_repos)} GitHub repositories",
            )

            # Create portfolio data
            portfolio_data = PortfolioData(
                personal_info=personal_info, projects=projects, metadata=metadata
            )

            logger.info(
                f"Successfully mapped {len(github_repos)} GitHub repositories to portfolio data"
            )
            return portfolio_data

        except Exception as e:
            logger.error(f"Failed to map GitHub data: {str(e)}")
            raise FirebaseError(f"Failed to map GitHub data: {str(e)}")

    def portfolio_exists(self, user_id: str) -> bool:
        """
        Check if portfolio data exists for a user.

        Args:
            user_id: User ID to check

        Returns:
            bool: True if portfolio exists, False otherwise
        """
        try:
            doc_ref = self.db.collection("portfolios").document(user_id)
            doc = doc_ref.get()
            return doc.exists
        except Exception as e:
            logger.error(
                f"Failed to check portfolio existence for user {user_id}: {str(e)}"
            )
            return False

    def delete_portfolio_data(self, user_id: str) -> bool:
        """
        Delete portfolio data for a user.

        Args:
            user_id: User ID to delete data for

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc_ref = self.db.collection("portfolios").document(user_id)
            doc_ref.delete()
            logger.info(f"Portfolio data deleted successfully for user {user_id}")
            return True
        except Exception as e:
            logger.error(
                f"Failed to delete portfolio data for user {user_id}: {str(e)}"
            )
            return False


# Global service instance
_portfolio_service: Optional[PortfolioService] = None


def get_portfolio_service() -> PortfolioService:
    """Get or create the global portfolio service instance."""
    global _portfolio_service
    if _portfolio_service is None:
        _portfolio_service = PortfolioService()
    return _portfolio_service
