"""
Username service for managing the dedicated usernames collection.

This service provides O(1) username lookups and guaranteed uniqueness
using Firebase document IDs as the unique constraint.
"""

from typing import Optional, Dict
from datetime import datetime
from functools import lru_cache
import logging
import time
import threading

import firebase_admin
from firebase_admin import firestore
from google.api_core.exceptions import AlreadyExists

from ..core.firebase import initialize_firebase

logger = logging.getLogger(__name__)

# TTL cache for username -> user_id mappings
_USERNAME_CACHE_TTL = 300  # 5 minutes
_USERNAME_CACHE_MAX_SIZE = 1000  # Max entries to prevent memory bloat
_username_cache: Dict[str, tuple] = {}  # {username: (user_id, timestamp)}
_cache_lock = threading.Lock()


def _evict_expired_entries() -> None:
    """Remove expired entries from cache. Must be called with lock held."""
    now = time.time()
    expired = [
        k for k, (_, ts) in _username_cache.items() if now - ts >= _USERNAME_CACHE_TTL
    ]
    for k in expired:
        del _username_cache[k]


def _ensure_cache_size() -> None:
    """Ensure cache doesn't exceed max size. Must be called with lock held."""
    if len(_username_cache) <= _USERNAME_CACHE_MAX_SIZE:
        return
    # Evict oldest entries first
    sorted_entries = sorted(_username_cache.items(), key=lambda x: x[1][1])
    to_remove = len(_username_cache) - _USERNAME_CACHE_MAX_SIZE
    for k, _ in sorted_entries[:to_remove]:
        del _username_cache[k]


class UsernameServiceError(Exception):
    """Custom exception for username service operations."""

    pass


class UsernameService:
    """Service for managing the usernames collection in Firestore."""

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
            logger.info("Firebase Firestore client initialized for username service")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase for username service: {e}")
            raise UsernameServiceError(f"Firebase initialization failed: {e}")

    def claim_username(self, username: str, user_id: str) -> bool:
        """
        Atomically claim a username for a user.

        This method attempts to create a document in the usernames collection
        with the username as the document ID. If the document already exists,
        the operation fails, ensuring uniqueness.

        Args:
            username: Username to claim (will be converted to lowercase)
            user_id: ID of the user claiming the username

        Returns:
            True if username was successfully claimed, False if already taken

        Raises:
            UsernameServiceError: On database errors
        """
        try:
            # Normalize to lowercase for case-insensitive uniqueness
            username_lower = username.lower()

            # Reference to the username document
            username_ref = self.db.collection("usernames").document(username_lower)

            try:
                # Create the username document (fails if already exists)
                username_ref.create(
                    {
                        "user_id": user_id,
                        "created_at": datetime.utcnow(),
                    }
                )
            except AlreadyExists:
                logger.info(f"Username '{username}' is already taken")
                return False

            # Update cache with new mapping (with size enforcement)
            with _cache_lock:
                _evict_expired_entries()
                _username_cache[username_lower] = (user_id, time.time())
                _ensure_cache_size()

            logger.info(
                f"Successfully claimed username '{username}' for user {user_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Error claiming username '{username}': {e}")
            raise UsernameServiceError(f"Failed to claim username: {e}")

    def release_username(self, username: str, user_id: str) -> None:
        """
        Release a username, verifying ownership first.

        Args:
            username: Username to release (will be converted to lowercase)
            user_id: ID of the user releasing the username

        Raises:
            UsernameServiceError: If user doesn't own the username or on database errors
        """
        try:
            # Normalize to lowercase
            username_lower = username.lower()

            # Reference to the username document
            username_ref = self.db.collection("usernames").document(username_lower)

            # Get the document to verify ownership
            doc = username_ref.get()

            if not doc.exists:
                logger.warning(
                    f"Attempted to release non-existent username '{username}'"
                )
                return

            # Verify ownership
            doc_data = doc.to_dict()
            owner_id = doc_data.get("user_id")

            if owner_id != user_id:
                raise UsernameServiceError(
                    f"User {user_id} does not own username '{username}'"
                )

            # Delete the username document
            username_ref.delete()

            # Invalidate cache
            with _cache_lock:
                _username_cache.pop(username_lower, None)

            logger.info(
                f"Successfully released username '{username}' for user {user_id}"
            )

        except UsernameServiceError:
            raise
        except Exception as e:
            logger.error(f"Error releasing username '{username}': {e}")
            raise UsernameServiceError(f"Failed to release username: {e}")

    def get_user_id_by_username(self, username: str) -> Optional[str]:
        """
        Get user ID by username with O(1) lookup and TTL caching.

        Args:
            username: Username to lookup (will be converted to lowercase)

        Returns:
            User ID if username exists, None otherwise

        Raises:
            UsernameServiceError: On database errors
        """
        try:
            username_lower = username.lower()
            now = time.time()

            # Check cache first
            with _cache_lock:
                if username_lower in _username_cache:
                    user_id, cached_at = _username_cache[username_lower]
                    if now - cached_at < _USERNAME_CACHE_TTL:
                        logger.debug(f"Cache hit for username '{username}'")
                        return user_id
                    # Cache expired, remove it
                    del _username_cache[username_lower]

            # Direct document get - O(1) operation
            username_ref = self.db.collection("usernames").document(username_lower)
            doc = username_ref.get()

            if not doc.exists:
                logger.debug(f"Username '{username}' not found")
                return None

            doc_data = doc.to_dict()
            user_id = doc_data.get("user_id")

            # Cache the result with size enforcement
            with _cache_lock:
                _evict_expired_entries()
                _username_cache[username_lower] = (user_id, now)
                _ensure_cache_size()

            logger.debug(f"Found user_id '{user_id}' for username '{username}'")
            return user_id

        except Exception as e:
            logger.error(f"Error looking up username '{username}': {e}")
            raise UsernameServiceError(f"Failed to lookup username: {e}")

    def is_username_available(self, username: str) -> bool:
        """
        Check if a username is available.

        Args:
            username: Username to check (will be converted to lowercase)

        Returns:
            True if username is available, False if taken

        Raises:
            UsernameServiceError: On database errors
        """
        try:
            # Normalize to lowercase
            username_lower = username.lower()

            # Direct document get - O(1) operation
            username_ref = self.db.collection("usernames").document(username_lower)
            doc = username_ref.get()

            is_available = not doc.exists

            logger.debug(f"Username '{username}' availability: {is_available}")
            return is_available

        except Exception as e:
            logger.error(f"Error checking availability of username '{username}': {e}")
            raise UsernameServiceError(f"Failed to check username availability: {e}")


# Singleton instance
_username_service = None


def get_username_service() -> UsernameService:
    """Get the singleton username service instance."""
    global _username_service
    if _username_service is None:
        _username_service = UsernameService()
    return _username_service
