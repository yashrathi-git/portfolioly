"""
Portfolio service for Firebase data persistence and GitHub mapping.

This service handles storing and retrieving portfolio data in Firestore,
as well as direct mapping of GitHub-only data to the portfolio schema.
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any, Sequence, TYPE_CHECKING
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from ..core.config import settings
from ..schemas.portfolio import PortfolioData, PersonalInfo, Project, PortfolioMetadata
from ..schemas.upload import GitHubRepoData

if TYPE_CHECKING:
    from .brandfetch_service import LogoUpdate

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

            # Preserve Brandfetch fields from existing portfolio if not provided
            doc_ref = self.db.collection("portfolios").document(user_id)
            existing_doc = doc_ref.get()
            if existing_doc.exists:
                existing_data = existing_doc.to_dict() or {}
                self._preserve_brandfetch_metadata(data_dict, existing_data)

            # Store in Firestore at portfolios/{userId}
            doc_ref.set(data_dict)

            logger.info(f"Portfolio data stored successfully for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store portfolio data for user {user_id}: {str(e)}")
            raise FirebaseError(f"Failed to store portfolio data: {str(e)}")

    def record_user_pdf_reference(
        self,
        user_id: str,
        *,
        source: str,
        blob_url: str,
        filename: Optional[str],
        checksum: Optional[str] = None,
    ) -> None:
        """Persist Azure Blob metadata for a user's uploaded PDF."""

        try:
            doc_ref = self.db.collection("user_pdf_uploads").document(user_id)

            payload: Dict[str, Any] = {
                source: {
                    "blob_url": blob_url,
                    "filename": filename,
                    "checksum": checksum,
                    "updated_at": datetime.utcnow(),
                },
                "last_updated": datetime.utcnow(),
            }

            doc_ref.set(payload, merge=True)

            logger.info("Stored PDF reference for user %s (source=%s)", user_id, source)

        except Exception as exc:
            logger.warning(
                "Failed to store PDF reference for user %s (source=%s): %s",
                user_id,
                source,
                exc,
            )

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

    def get_portfolio_by_username(self, username: str) -> Optional[PortfolioData]:
        """
        Retrieve portfolio data by username.

        This method looks up the user_id from user_settings collection by username,
        then retrieves the portfolio data.

        Args:
            username: Username to retrieve portfolio for

        Returns:
            PortfolioData or None if not found

        Raises:
            FirebaseError: If retrieval operation fails
        """
        try:
            # Query user_settings collection to find user_id by username
            user_settings_ref = self.db.collection("user_settings")
            query = user_settings_ref.where(
                filter=FieldFilter("username", "==", username)
            ).limit(1)
            docs = query.stream()

            # Get the first matching document
            user_doc = next(docs, None)

            if not user_doc:
                logger.info(f"No user found with username: {username}")
                return None

            user_settings = user_doc.to_dict()
            user_id = user_settings.get("user_id")

            if not user_id:
                logger.error(
                    f"User settings found for username '{username}' but no user_id"
                )
                return None

            # Now get the portfolio data using the user_id
            return self.get_portfolio_data(user_id)

        except Exception as e:
            logger.error(
                f"Failed to retrieve portfolio data for username {username}: {str(e)}"
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

                # Create highlights as markdown string
                highlights_list = []
                if repo.stars > 0:
                    highlights_list.append(f"⭐ {repo.stars} stars")
                if repo.description:
                    highlights_list.append(repo.description)

                # Convert list to markdown string
                highlights = (
                    "\n".join(f"- {h}" for h in highlights_list)
                    if highlights_list
                    else None
                )

                # Create project entry
                project = Project(
                    name=repo.name,
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

    async def apply_brandfetch_logo_updates(
        self, user_id: str, updates: Sequence["LogoUpdate"]
    ) -> None:
        """Apply Brandfetch logo updates to specific portfolio entries."""

        if not updates:
            return

        await asyncio.to_thread(
            self._apply_brandfetch_logo_updates_sync, user_id, updates
        )

    def _apply_brandfetch_logo_updates_sync(
        self, user_id: str, updates: Sequence["LogoUpdate"]
    ) -> None:
        doc_ref = self.db.collection("portfolios").document(user_id)
        doc = doc_ref.get()

        if not doc.exists:
            logger.info(
                "Skipping Brandfetch updates for user %s: portfolio not found",
                user_id,
            )
            return

        data = doc.to_dict() or {}

        batch_updates: Dict[str, Any] = {}

        for update in updates:
            section_items = data.get(update.section) or []

            if not isinstance(section_items, list):
                continue

            if update.index < 0 or update.index >= len(section_items):
                continue

            entry = section_items[update.index]
            if not isinstance(entry, dict):
                entry = {}
                section_items[update.index] = entry

            current_logo = entry.get("brandfetch_logo_url")
            current_domain = entry.get("brandfetch_domain")

            entry_changed = False

            if current_logo != update.brandfetch_logo_url:
                entry["brandfetch_logo_url"] = update.brandfetch_logo_url
                entry_changed = True

            if current_domain != update.brandfetch_domain:
                entry["brandfetch_domain"] = update.brandfetch_domain
                entry_changed = True

            existing_logo_value = entry.get("logo_url")
            has_primary_logo = False
            if isinstance(existing_logo_value, str):
                has_primary_logo = bool(existing_logo_value.strip())
            else:
                has_primary_logo = bool(existing_logo_value)

            if (
                not has_primary_logo
                and update.brandfetch_logo_url
                and existing_logo_value != update.brandfetch_logo_url
            ):
                entry["logo_url"] = update.brandfetch_logo_url
                entry_changed = True

            if not entry_changed:
                continue

            batch_updates[update.section] = section_items

        if not batch_updates:
            return

        batch_updates["updated_at"] = datetime.utcnow()

        doc_ref.update(batch_updates)

    @staticmethod
    def _normalize_name(value: Optional[str]) -> Optional[str]:
        if not isinstance(value, str):
            return None
        normalized = value.strip().lower()
        return normalized or None

    def _preserve_brandfetch_metadata(
        self, new_data: Dict[str, Any], existing_data: Dict[str, Any]
    ) -> None:
        self._merge_brandfetch_section(
            new_data,
            existing_data,
            section="work_experiences",
            name_key="organization",
        )
        self._merge_brandfetch_section(
            new_data,
            existing_data,
            section="education",
            name_key="institution",
        )

    def _merge_brandfetch_section(
        self,
        new_data: Dict[str, Any],
        existing_data: Dict[str, Any],
        *,
        section: str,
        name_key: str,
    ) -> None:
        new_items = new_data.get(section)
        existing_items = existing_data.get(section)

        if not isinstance(new_items, list) or not isinstance(existing_items, list):
            return

        lookup_by_index = {idx: item for idx, item in enumerate(existing_items)}

        lookup_by_name = {}
        for idx, item in enumerate(existing_items):
            if not isinstance(item, dict):
                continue
            name_value = self._normalize_name(item.get(name_key))
            if name_value and name_value not in lookup_by_name:
                lookup_by_name[name_value] = item

        for idx, entry in enumerate(new_items):
            if not isinstance(entry, dict):
                continue

            existing_entry = lookup_by_index.get(idx)
            if not existing_entry:
                name_value = self._normalize_name(entry.get(name_key))
                if name_value:
                    existing_entry = lookup_by_name.get(name_value)

            if not existing_entry:
                continue

            for field in ("brandfetch_logo_url", "brandfetch_domain"):
                current_value = entry.get(field)
                if current_value in (None, ""):
                    preserved_value = existing_entry.get(field)
                    if preserved_value not in (None, ""):
                        entry[field] = preserved_value

    async def update_profile_photo(
        self, user_id: str, photo_url: Optional[str]
    ) -> bool:
        """
        Update the profile photo URL in the user's portfolio data.

        This method updates the profile_photo_url field in the personal_info
        section of the portfolio. If the portfolio doesn't exist, it creates
        a minimal portfolio with just the photo URL.

        Args:
            user_id: User ID to update photo for
            photo_url: New photo URL (or None to remove photo)

        Returns:
            bool: True if successful, False otherwise

        Raises:
            FirebaseError: If update operation fails
        """
        try:
            doc_ref = self.db.collection("portfolios").document(user_id)

            # Check if portfolio exists
            doc = doc_ref.get()

            if doc.exists:
                # Update existing portfolio
                doc_ref.update(
                    {
                        "personal_info.profile_photo_url": photo_url,
                        "updated_at": datetime.utcnow(),
                    }
                )
                logger.info(
                    f"Profile photo URL updated for user {user_id}: {photo_url}"
                )
            else:
                # Create minimal portfolio with photo URL
                minimal_portfolio = PortfolioData(
                    personal_info=PersonalInfo(profile_photo_url=photo_url)
                )
                data_dict = minimal_portfolio.model_dump()
                data_dict["updated_at"] = datetime.utcnow()
                doc_ref.set(data_dict)
                logger.info(
                    f"Created new portfolio with profile photo for user {user_id}"
                )

            return True

        except Exception as e:
            logger.error(f"Failed to update profile photo for user {user_id}: {str(e)}")
            raise FirebaseError(f"Failed to update profile photo: {str(e)}")


# Global service instance
_portfolio_service: Optional[PortfolioService] = None


def get_portfolio_service() -> PortfolioService:
    """Get or create the global portfolio service instance."""
    global _portfolio_service
    if _portfolio_service is None:
        _portfolio_service = PortfolioService()
    return _portfolio_service
