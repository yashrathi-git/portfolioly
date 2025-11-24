"""
Notification service for managing user notification signups.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

import firebase_admin
from firebase_admin import firestore

from ..core.firebase import initialize_firebase
from ..schemas.notification import NotificationPreference

logger = logging.getLogger(__name__)


class NotificationServiceError(Exception):
    """Custom exception for notification service operations."""

    pass


class NotificationService:
    """Service for managing notification signups in Firestore."""

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
            logger.info("Firebase Firestore client initialized for notifications")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase for notifications: {e}")
            raise NotificationServiceError(f"Firebase initialization failed: {e}")

    def is_signed_up(self, user_id: str, notification_type: str) -> bool:
        """Check if user is signed up for a notification type."""
        try:
            doc_ref = (
                self.db.collection("notifications")
                .document(user_id)
                .collection("preferences")
                .document(notification_type)
            )
            doc = doc_ref.get()
            return doc.exists

        except Exception as e:
            logger.error(f"Error checking notification signup for user {user_id}: {e}")
            raise NotificationServiceError(f"Failed to check notification signup: {e}")

    def get_all_signups(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all notification signups for a user."""
        try:
            prefs_ref = (
                self.db.collection("notifications")
                .document(user_id)
                .collection("preferences")
            )
            docs = prefs_ref.stream()

            signups = []
            for doc in docs:
                data = doc.to_dict()
                data["notification_type"] = doc.id
                signups.append(data)

            logger.debug(f"Retrieved {len(signups)} signups for user {user_id}")
            return signups

        except Exception as e:
            logger.error(f"Error retrieving signups for user {user_id}: {e}")
            raise NotificationServiceError(f"Failed to retrieve signups: {e}")

    def get_signup_status(self, user_id: str) -> Dict[str, bool]:
        """Get signup status for all notification types in a single query."""
        try:
            prefs_ref = (
                self.db.collection("notifications")
                .document(user_id)
                .collection("preferences")
            )
            docs = prefs_ref.stream()

            status = {
                "resume_feature": False,
                "analytics_feature": False,
            }

            for doc in docs:
                if doc.id in status:
                    status[doc.id] = True

            logger.debug(f"Retrieved signup status for user {user_id}")
            return status

        except Exception as e:
            logger.error(f"Error retrieving signup status for user {user_id}: {e}")
            raise NotificationServiceError(f"Failed to retrieve signup status: {e}")

    def signup_for_notification(
        self, user_id: str, notification_type: str
    ) -> NotificationPreference:
        """Sign up user for a notification type."""
        try:
            doc_ref = (
                self.db.collection("notifications")
                .document(user_id)
                .collection("preferences")
                .document(notification_type)
            )

            if doc_ref.get().exists:
                logger.info(f"User {user_id} already signed up for {notification_type}")
                data = doc_ref.get().to_dict()
                return NotificationPreference(**data)

            now = datetime.utcnow()
            preference = NotificationPreference(
                user_id=user_id,
                notification_type=notification_type,
                created_at=now,
            )
            doc_ref.set(preference.dict())
            logger.info(f"User {user_id} signed up for {notification_type}")

            return preference

        except Exception as e:
            logger.error(f"Error signing up user {user_id} for notification: {e}")
            raise NotificationServiceError(f"Failed to signup for notification: {e}")


_notification_service = None


def get_notification_service() -> NotificationService:
    """Get the singleton notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
