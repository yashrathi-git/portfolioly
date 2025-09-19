"""Firebase initialization and configuration."""

import os
import firebase_admin
from firebase_admin import credentials, auth as admin_auth
from .config import settings


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    if firebase_admin._apps:
        return  # Already initialized

    cred_path = settings.google_application_credentials
    if not cred_path:
        # Fallback to hardcoded path (for development)
        cred_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "firebaseServiceKeyJson",
            "firebaseServiceKey.json",
        )

    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Fallback to application default credentials (useful on GCP)
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)


def get_firebase_auth():
    """Get Firebase Auth instance."""
    return admin_auth
