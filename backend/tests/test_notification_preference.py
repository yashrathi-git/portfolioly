"""
Tests for notification preference functionality.

This module tests the notification preference feature for the Resume Maker,
ensuring that users can opt-in to be notified when the feature launches.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestNotificationPreference:
    """Test notification preference functionality."""

    def test_get_settings_returns_default_notify_false(
        self, client, mock_authenticated_user, mock_firestore_empty
    ):
        """Test that GET /users/me/settings returns notify_for_resume_feature as false by default."""
        response = client.get("/users/me/settings")

        assert response.status_code == 200
        data = response.json()
        assert "notify_for_resume_feature" in data
        assert data["notify_for_resume_feature"] is False

    def test_get_settings_returns_notify_preference(
        self, client, mock_authenticated_user, mock_firestore_client
    ):
        """Test that GET /users/me/settings returns the stored notify_for_resume_feature value."""
        # Add test data to mock Firestore
        mock_firestore_client.collection("user_settings").add_document(
            "test_user_123",
            {
                "user_id": "test_user_123",
                "username": "testuser",
                "chat_settings": {"access_mode": "private"},
                "notify_for_resume_feature": True,
            },
        )

        response = client.get("/users/me/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["notify_for_resume_feature"] is True

    def test_patch_settings_updates_notify_preference(
        self, client, mock_authenticated_user, mock_firestore_client
    ):
        """Test that PATCH /users/me/settings updates notify_for_resume_feature."""
        # Add initial test data
        mock_firestore_client.collection("user_settings").add_document(
            "test_user_123",
            {
                "user_id": "test_user_123",
                "username": "testuser",
                "chat_settings": {"access_mode": "private"},
                "notify_for_resume_feature": False,
            },
        )

        response = client.patch(
            "/users/me/settings",
            json={"notify_for_resume_feature": True},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notify_for_resume_feature"] is True

        # Verify the document was updated in mock Firestore
        doc = (
            mock_firestore_client.collection("user_settings")
            .document("test_user_123")
            .to_dict()
        )
        assert doc["notify_for_resume_feature"] is True

    def test_patch_settings_toggles_notify_preference(
        self, client, mock_authenticated_user, mock_firestore_client
    ):
        """Test that notification preference can be toggled from true to false."""
        # Add initial test data with notify=true
        mock_firestore_client.collection("user_settings").add_document(
            "test_user_123",
            {
                "user_id": "test_user_123",
                "username": "testuser",
                "chat_settings": {"access_mode": "private"},
                "notify_for_resume_feature": True,
            },
        )

        response = client.patch(
            "/users/me/settings",
            json={"notify_for_resume_feature": False},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notify_for_resume_feature"] is False

        # Verify the document was updated in mock Firestore
        doc = (
            mock_firestore_client.collection("user_settings")
            .document("test_user_123")
            .to_dict()
        )
        assert doc["notify_for_resume_feature"] is False

    def test_notification_preference_persists_across_requests(
        self, client, mock_authenticated_user, mock_firestore_client
    ):
        """Test that notification preference persists across multiple requests."""
        # Add initial test data
        mock_firestore_client.collection("user_settings").add_document(
            "test_user_123",
            {
                "user_id": "test_user_123",
                "username": "testuser",
                "chat_settings": {"access_mode": "private"},
                "notify_for_resume_feature": False,
            },
        )

        # Set notification preference to true
        client.patch(
            "/users/me/settings",
            json={"notify_for_resume_feature": True},
        )

        # Fetch settings again
        response = client.get("/users/me/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["notify_for_resume_feature"] is True

        # Toggle to false
        client.patch(
            "/users/me/settings",
            json={"notify_for_resume_feature": False},
        )

        # Fetch again
        response = client.get("/users/me/settings")

        assert response.status_code == 200
        data = response.json()
        assert data["notify_for_resume_feature"] is False
