"""Firebase initialization and configuration."""

import json
import logging
import os

import firebase_admin
from firebase_admin import auth as admin_auth
from firebase_admin import credentials

from .config import settings

logger = logging.getLogger(__name__)


def _load_credentials_from_file(path: str | None):
    """Load credentials from a service account file if it exists."""
    if not path:
        return None

    if os.path.exists(path):
        logger.info("Initializing Firebase with credentials file at %s", path)
        return credentials.Certificate(path)

    logger.warning("Firebase credentials file not found at %s", path)
    return None


def _load_credentials_from_env(json_payload: str | None):
    """Load credentials from a flattened JSON string."""
    if not json_payload:
        return None
    # print(json_payload)
    try:
        parsed_payload = json.loads(json_payload)
    except json.JSONDecodeError as exc:
        raise ValueError("FIREBASE_CREDENTIALS contains invalid JSON") from exc

    logger.info(
        "Initializing Firebase with credentials provided via FIREBASE_CREDENTIALS"
    )
    return credentials.Certificate(parsed_payload)


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    if firebase_admin._apps:
        return  # Already initialized

    cred = None

    # 1. Respect explicit GOOGLE_APPLICATION_CREDENTIALS path
    cred = _load_credentials_from_file(settings.google_application_credentials)

    # 2. Fallback to FIREBASE_CREDENTIALS JSON payload
    if cred is None:
        firebase_json = (settings.firebase_credentials or "").strip() or None
        cred = _load_credentials_from_env(firebase_json)

    # 3. Development fallback to repository service account file
    if cred is None:
        repo_cred_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "firebaseServiceKeyJson",
            "firebaseServiceKey.json",
        )
        cred = _load_credentials_from_file(repo_cred_path)

    # 4. Last resort: use application default credentials
    if cred is None:
        logger.info("Falling back to Application Default Credentials for Firebase")
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)


def get_firebase_auth():
    """Get Firebase Auth instance."""
    return admin_auth
