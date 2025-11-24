"""
Tests for notification signup endpoints.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.auth import UserToken


@pytest.fixture
def mock_user():
    return UserToken(uid="test_user_123", email="test@example.com")


@pytest.fixture
def client():
    return TestClient(app)


@patch("app.routes.notifications.rate_limited_core_user")
@patch("app.routes.notifications.get_notification_service")
def test_get_notification_status(mock_service, mock_auth, client, mock_user):
    mock_auth.return_value = mock_user
    mock_service.return_value.get_signup_status.return_value = {
        "resume_feature": True,
        "analytics_feature": False,
    }

    response = client.get("/notifications")

    assert response.status_code == 200
    data = response.json()
    assert data["resume_feature"] is True
    assert data["analytics_feature"] is False
    mock_service.return_value.get_signup_status.assert_called_once_with(mock_user.uid)


@patch("app.routes.notifications.rate_limited_core_user")
@patch("app.routes.notifications.get_notification_service")
def test_signup_for_notification(mock_service, mock_auth, client, mock_user):
    mock_auth.return_value = mock_user
    mock_service.return_value.signup_for_notification.return_value = None

    response = client.post(
        "/notifications",
        json={"notification_type": "resume_feature"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["notification_type"] == "resume_feature"
    mock_service.return_value.signup_for_notification.assert_called_once_with(
        mock_user.uid, "resume_feature"
    )
