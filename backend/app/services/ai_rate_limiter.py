"""
AI processing rate limiter with Firebase persistence.

This service handles monthly rate limiting for AI processing requests
with persistent storage in Firebase Firestore.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from calendar import monthrange

import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from ..core.config import settings

logger = logging.getLogger(__name__)


class AIRateLimitError(Exception):
    """Exception raised when AI processing rate limit is exceeded."""

    pass


class AIRateLimiter:
    """
    Firebase-backed rate limiter for AI processing requests.

    Enforces a monthly limit of 10 AI processing requests per user
    with automatic reset on the first day of each month.
    """

    # Monthly limit constant
    MONTHLY_LIMIT = 10

    def __init__(self):
        """Initialize the AI rate limiter."""
        self._db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase connection if not already done."""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            logger.info("Firebase already initialized for AI rate limiter")
        except ValueError:
            # Initialize Firebase (should already be done by portfolio service)
            if settings.google_application_credentials:
                cred = firebase_admin.credentials.Certificate(
                    settings.google_application_credentials
                )
                firebase_admin.initialize_app(
                    cred, {"projectId": settings.firebase_project_id}
                )
                logger.info("Firebase initialized for AI rate limiter")
            else:
                firebase_admin.initialize_app()
                logger.info(
                    "Firebase initialized with default credentials for AI rate limiter"
                )

        # Get Firestore client
        self._db = firestore.client()

    @property
    def db(self):
        """Get Firestore database client."""
        if self._db is None:
            self._initialize_firebase()
        return self._db

    def _get_current_month_start(self) -> datetime:
        """Get the start of the current month in UTC."""
        now = datetime.now(timezone.utc)
        return datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    def _get_next_month_start(self) -> datetime:
        """Get the start of the next month in UTC."""
        now = datetime.now(timezone.utc)
        if now.month == 12:
            return datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            return datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)

    def check_rate_limit(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has exceeded their monthly AI processing rate limit.

        Args:
            user_id: User ID to check

        Returns:
            Dict with rate limit information

        Raises:
            AIRateLimitError: If rate limit is exceeded
        """
        try:
            current_month_start = self._get_current_month_start()
            next_month_start = self._get_next_month_start()

            # Get or create rate limit document
            doc_ref = self.db.collection("ai_rate_limits").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                reset_date = data.get("reset_date")
                usage_count = data.get("usage_count", 0)

                # Check if we need to reset the counter
                if (
                    reset_date
                    and reset_date.replace(tzinfo=timezone.utc) <= current_month_start
                ):
                    # Reset counter for new month
                    usage_count = 0
                    doc_ref.update(
                        {
                            "usage_count": 0,
                            "reset_date": next_month_start,
                            "last_updated": datetime.now(timezone.utc),
                        }
                    )
                    logger.info(f"Reset AI rate limit counter for user {user_id}")
            else:
                # Create new rate limit document
                usage_count = 0
                doc_ref.set(
                    {
                        "user_id": user_id,
                        "usage_count": 0,
                        "reset_date": next_month_start,
                        "created_at": datetime.now(timezone.utc),
                        "last_updated": datetime.now(timezone.utc),
                    }
                )
                logger.info(f"Created AI rate limit document for user {user_id}")

            # Check if limit is exceeded
            if usage_count >= self.MONTHLY_LIMIT:
                raise AIRateLimitError(
                    f"Monthly AI processing limit exceeded ({usage_count}/{self.MONTHLY_LIMIT}). "
                    f"Resets on {next_month_start.strftime('%Y-%m-%d')}"
                )

            return {
                "current_usage": usage_count,
                "monthly_limit": self.MONTHLY_LIMIT,
                "remaining": self.MONTHLY_LIMIT - usage_count,
                "reset_date": next_month_start.isoformat(),
                "limit_exceeded": False,
            }

        except AIRateLimitError:
            raise
        except Exception as e:
            logger.error(f"Failed to check AI rate limit for user {user_id}: {str(e)}")
            # In case of error, allow the request but log the issue
            return {
                "current_usage": 0,
                "monthly_limit": self.MONTHLY_LIMIT,
                "remaining": self.MONTHLY_LIMIT,
                "reset_date": next_month_start.isoformat(),
                "limit_exceeded": False,
                "error": str(e),
            }

    def increment_usage(self, user_id: str) -> bool:
        """
        Increment the AI processing usage count for a user.

        Args:
            user_id: User ID to increment usage for

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc_ref = self.db.collection("ai_rate_limits").document(user_id)

            # Use transaction to ensure atomic increment
            @firestore.transactional
            def increment_transaction(transaction):
                doc = doc_ref.get(transaction=transaction)
                if doc.exists:
                    current_count = doc.to_dict().get("usage_count", 0)
                    transaction.update(
                        doc_ref,
                        {
                            "usage_count": current_count + 1,
                            "last_updated": datetime.now(timezone.utc),
                        },
                    )
                else:
                    # This shouldn't happen if check_rate_limit was called first
                    transaction.set(
                        doc_ref,
                        {
                            "user_id": user_id,
                            "usage_count": 1,
                            "reset_date": self._get_next_month_start(),
                            "created_at": datetime.now(timezone.utc),
                            "last_updated": datetime.now(timezone.utc),
                        },
                    )

            transaction = self.db.transaction()
            increment_transaction(transaction)

            logger.info(f"Incremented AI usage count for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to increment AI usage for user {user_id}: {str(e)}")
            return False

    def get_usage_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current usage information for a user.

        Args:
            user_id: User ID to get info for

        Returns:
            Dict with usage information or None if not found
        """
        try:
            doc_ref = self.db.collection("ai_rate_limits").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                return {
                    "user_id": data.get("user_id"),
                    "usage_count": data.get("usage_count", 0),
                    "monthly_limit": self.MONTHLY_LIMIT,
                    "reset_date": data.get("reset_date"),
                    "last_updated": data.get("last_updated"),
                }
            return None

        except Exception as e:
            logger.error(f"Failed to get AI usage info for user {user_id}: {str(e)}")
            return None


# Global service instance
_ai_rate_limiter: Optional[AIRateLimiter] = None


def get_ai_rate_limiter() -> AIRateLimiter:
    """Get or create the global AI rate limiter instance."""
    global _ai_rate_limiter
    if _ai_rate_limiter is None:
        _ai_rate_limiter = AIRateLimiter()
    return _ai_rate_limiter
