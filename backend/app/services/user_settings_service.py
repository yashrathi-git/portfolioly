"""
User settings service for managing usernames and portfolio visibility.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import logging
import re
import secrets
import string

import firebase_admin
from firebase_admin import firestore

from ..core.firebase import initialize_firebase
from ..schemas.user_settings import (
    PortfolioChatSettings,
    UserSettings,
    UserSettingsCreate,
    UserSettingsUpdate,
)

logger = logging.getLogger(__name__)


class UserSettingsError(Exception):
    """Custom exception for user settings operations."""

    pass


class UserSettingsService:
    """Service for managing user settings in Firestore."""

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
            # Initialize Firebase if not already done
            if not firebase_admin._apps:
                initialize_firebase()

            self._db = firestore.client()
            logger.info("Firebase Firestore client initialized for user settings")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase for user settings: {e}")
            raise UserSettingsError(f"Firebase initialization failed: {e}")

    def get_user_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user settings by user ID."""
        try:
            doc_ref = self.db.collection("user_settings").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                logger.debug(f"Retrieved user settings for user {user_id}")
                return data

            logger.debug(f"No user settings found for user {user_id}")
            return None

        except Exception as e:
            logger.error(f"Error retrieving user settings for user {user_id}: {e}")
            raise UserSettingsError(f"Failed to retrieve user settings: {e}")

    def get_user_settings_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user settings by username."""
        try:
            # Normalize username to lowercase for lookup
            username_lower = username.lower()

            query = (
                self.db.collection("user_settings")
                .where("username", "==", username_lower)
                .limit(1)
            )
            docs = query.stream()

            for doc in docs:
                data = doc.to_dict()
                logger.debug(f"Retrieved user settings for username {username}")
                return data

            logger.debug(f"No user settings found for username {username}")
            return None

        except Exception as e:
            logger.error(f"Error retrieving user settings for username {username}: {e}")
            raise UserSettingsError(
                f"Failed to retrieve user settings by username: {e}"
            )

    def create_user_settings(
        self, user_id: str, settings: UserSettingsCreate
    ) -> UserSettings:
        """Create new user settings."""
        try:
            now = datetime.utcnow()

            user_settings = UserSettings(
                user_id=user_id,
                username=settings.username,
                created_at=now,
                updated_at=now,
                chat_settings=PortfolioChatSettings(access_mode=settings.access_mode),
            )

            # Check if username is already taken (if provided)
            if user_settings.username:
                existing = self.get_user_settings_by_username(user_settings.username)
                if existing and existing.get("user_id") != user_id:
                    raise UserSettingsError("Username is already taken")

            # Store in Firestore
            doc_ref = self.db.collection("user_settings").document(user_id)
            doc_ref.set(user_settings.dict())

            logger.info(f"Created user settings for user {user_id}")
            return user_settings

        except UserSettingsError:
            raise
        except Exception as e:
            logger.error(f"Error creating user settings for user {user_id}: {e}")
            raise UserSettingsError(f"Failed to create user settings: {e}")

    def update_user_settings(
        self, user_id: str, updates: UserSettingsUpdate
    ) -> UserSettings:
        """Update existing user settings."""
        try:
            # Get existing settings
            existing_data = self.get_user_settings(user_id)
            if not existing_data:
                # Create new settings if none exist
                create_data = UserSettingsCreate(
                    username=updates.username,
                    access_mode=updates.access_mode or "private",
                )
                return self.create_user_settings(user_id, create_data)

            # Check if username is already taken (if being updated)
            if updates.username and updates.username != existing_data.get("username"):
                existing = self.get_user_settings_by_username(updates.username)
                if existing and existing.get("user_id") != user_id:
                    raise UserSettingsError("Username is already taken")

            # Prepare update data
            update_data = {"updated_at": datetime.utcnow()}

            if updates.username is not None:
                update_data["username"] = (
                    updates.username.lower() if updates.username else None
                )

            if updates.access_mode is not None:
                update_data["chat_settings.access_mode"] = updates.access_mode

            # Update in Firestore
            doc_ref = self.db.collection("user_settings").document(user_id)
            doc_ref.update(update_data)

            # Return updated settings
            updated_data = self.get_user_settings(user_id)
            logger.info(f"Updated user settings for user {user_id}")

            return UserSettings(**updated_data)

        except UserSettingsError:
            raise
        except Exception as e:
            logger.error(f"Error updating user settings for user {user_id}: {e}")
            raise UserSettingsError(f"Failed to update user settings: {e}")

    def set_username(self, user_id: str, username: str) -> None:
        """Set or update user's username."""
        updates = UserSettingsUpdate(username=username)
        self.update_user_settings(user_id, updates)

    def remove_username(self, user_id: str) -> None:
        """Remove username and set portfolio to private."""
        updates = UserSettingsUpdate(username=None, access_mode="private")
        self.update_user_settings(user_id, updates)

    def update_access_mode(self, user_id: str, access_mode: str) -> None:
        """Update the access mode for a user's portfolio."""
        try:
            doc_ref = self.db.collection("user_settings").document(user_id)

            # Update chat_settings.access_mode and updated_at timestamp
            doc_ref.update(
                {
                    "chat_settings.access_mode": access_mode,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                }
            )

            logger.info(f"Updated access mode to {access_mode} for user {user_id}")

        except Exception as e:
            logger.error(f"Error updating access mode for user {user_id}: {e}")
            raise UserSettingsError(f"Failed to update access mode: {e}")

    def validate_username(self, username: str) -> Dict[str, Any]:
        """Validate username format and availability."""
        try:
            # Basic format validation
            if not username:
                return {"valid": False, "error": "Username is required"}

            if len(username) < 3:
                return {
                    "valid": False,
                    "error": "Username must be at least 3 characters long",
                }

            if len(username) > 30:
                return {
                    "valid": False,
                    "error": "Username must be no more than 30 characters long",
                }

            # Allow alphanumeric characters, hyphens, and underscores
            if not re.match(r"^[a-zA-Z0-9_-]+$", username):
                return {
                    "valid": False,
                    "error": "Username can only contain letters, numbers, hyphens, and underscores",
                }

            # Don't allow usernames that start or end with hyphens/underscores
            if username.startswith(("-", "_")) or username.endswith(("-", "_")):
                return {
                    "valid": False,
                    "error": "Username cannot start or end with hyphens or underscores",
                }

            # Reserved usernames
            reserved = {
                "admin",
                "api",
                "www",
                "mail",
                "ftp",
                "localhost",
                "root",
                "support",
                "help",
                "about",
                "contact",
            }
            if username.lower() in reserved:
                return {"valid": False, "error": "This username is reserved"}

            return {"valid": True}

        except Exception as e:
            logger.error(f"Error validating username {username}: {e}")
            return {"valid": False, "error": "Username validation failed"}

    def generate_username_from_email(self, email: str) -> str:
        """
        Generate a unique username from an email address.

        Algorithm:
        1. Extract part before @ from email
        2. Sanitize to alphanumeric + hyphens/underscores
        3. Try username alone first
        4. If taken, append 6-char URL-safe random string (base62: a-zA-Z0-9)
        5. Keep trying until unique (max 10 attempts)

        Args:
            email: User's email address

        Returns:
            str: A unique username

        Raises:
            UserSettingsError: If unable to generate unique username after max attempts
        """
        try:
            # Extract and sanitize email prefix
            email_prefix = email.split("@")[0]
            base_username = re.sub(r"[^a-zA-Z0-9_-]", "", email_prefix).lower()

            # Ensure base username is not empty
            if not base_username:
                base_username = "user"

            # Ensure minimum length
            if len(base_username) < 3:
                base_username = base_username + "user"

            # Try base username first
            if not self.get_user_settings_by_username(base_username):
                logger.info(f"Generated username from email: {base_username}")
                return base_username

            # Try with random suffix (base62: a-zA-Z0-9)
            chars = string.ascii_letters + string.digits
            max_attempts = 10

            for attempt in range(max_attempts):
                suffix = "".join(secrets.choice(chars) for _ in range(6))
                username = f"{base_username}_{suffix}"

                if not self.get_user_settings_by_username(username):
                    logger.info(
                        f"Generated username from email with suffix: {username}"
                    )
                    return username

            # If we get here, we failed to generate a unique username
            raise UserSettingsError(
                f"Failed to generate unique username after {max_attempts} attempts"
            )

        except UserSettingsError:
            raise
        except Exception as e:
            logger.error(f"Error generating username from email {email}: {e}")
            raise UserSettingsError(f"Failed to generate username: {e}")


# Singleton instance
_user_settings_service = None


def get_user_settings_service() -> UserSettingsService:
    """Get the singleton user settings service instance."""
    global _user_settings_service
    if _user_settings_service is None:
        _user_settings_service = UserSettingsService()
    return _user_settings_service
