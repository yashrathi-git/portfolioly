"""Waitlist service for managing email signups."""

from datetime import datetime
import logging
from typing import Optional

import firebase_admin
from firebase_admin import firestore

from ..core.firebase import initialize_firebase
from ..schemas.waitlist import WaitlistEntry

logger = logging.getLogger(__name__)


class WaitlistServiceError(Exception):
    """Custom exception for waitlist service operations."""

    pass


class WaitlistService:
    """Service for managing waitlist signups in Firestore."""

    COLLECTION_NAME = "waitlist"

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
            logger.info("Firebase Firestore client initialized for waitlist")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase for waitlist: {e}")
            raise WaitlistServiceError(f"Firebase initialization failed: {e}")

    def _get_doc_id(self, email: str, source: str) -> str:
        """Generate document ID from email and source."""
        # Use email hash to avoid special characters in doc ID
        import hashlib

        email_hash = hashlib.sha256(email.lower().encode()).hexdigest()[:16]
        return f"{source}_{email_hash}"

    def is_already_signed_up(self, email: str, source: str) -> bool:
        """Check if email is already signed up for a waitlist."""
        try:
            doc_id = self._get_doc_id(email, source)
            doc_ref = self.db.collection(self.COLLECTION_NAME).document(doc_id)
            return doc_ref.get().exists
        except Exception as e:
            logger.error(f"Error checking waitlist signup: {e}")
            raise WaitlistServiceError(f"Failed to check waitlist signup: {e}")

    def signup(
        self, email: str, source: str, ip_address: Optional[str] = None
    ) -> tuple[bool, bool]:
        """
        Sign up email for waitlist.
        Returns (success, already_signed_up)
        """
        try:
            doc_id = self._get_doc_id(email, source)
            doc_ref = self.db.collection(self.COLLECTION_NAME).document(doc_id)

            if doc_ref.get().exists:
                logger.info(f"Email already signed up for {source} waitlist")
                return True, True

            entry = WaitlistEntry(
                email=email.lower(),
                source=source,
                created_at=datetime.utcnow(),
                ip_address=ip_address,
            )
            doc_ref.set(entry.model_dump())
            logger.info(f"New signup for {source} waitlist")
            return True, False

        except Exception as e:
            logger.error(f"Error signing up for waitlist: {e}")
            raise WaitlistServiceError(f"Failed to signup for waitlist: {e}")


_waitlist_service: Optional[WaitlistService] = None


def get_waitlist_service() -> WaitlistService:
    """Get the singleton waitlist service instance."""
    global _waitlist_service
    if _waitlist_service is None:
        _waitlist_service = WaitlistService()
    return _waitlist_service
