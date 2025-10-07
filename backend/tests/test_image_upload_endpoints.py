"""Tests for image upload endpoints."""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from io import BytesIO

from app.main import app


class TestImageUploadEndpoints:
    """Test image upload endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @patch("app.routes.portfolio.upload_profile_photo_to_storage")
    @patch("app.routes.portfolio.update_portfolio_with_photo")
    def test_upload_profile_photo_success(
        self,
        mock_update_portfolio,
        mock_upload_storage,
        client,
        mock_verified_user,
    ):
        """Test successful profile photo upload."""
        # Setup mocks
        mock_upload_storage.return_value = "https://example.com/photo.webp"
        mock_update_portfolio.return_value = None

        # Make request
        response = client.post(
            "/portfolio/profile-photo",
            files={"file": ("test.jpg", b"fake image data", "image/jpeg")},
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert "photo_url" in data
        assert data["photo_url"] == "https://example.com/photo.webp"

    @patch("app.routes.portfolio.upload_project_images_to_storage")
    def test_upload_project_images_success(
        self,
        mock_upload_storage,
        client,
        mock_verified_user,
    ):
        """Test successful project images upload."""
        # Setup mocks
        mock_upload_storage.return_value = [
            "https://example.com/project1.webp",
            "https://example.com/project2.webp",
        ]

        # Make request with 2 images
        response = client.post(
            "/portfolio/project-images",
            files=[
                ("files", ("test1.jpg", b"fake image data 1", "image/jpeg")),
                ("files", ("test2.jpg", b"fake image data 2", "image/jpeg")),
            ],
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert "image_urls" in data
        assert len(data["image_urls"]) == 2

    @patch("app.routes.portfolio.upload_project_images_to_storage")
    def test_upload_project_images_exceeds_limit(
        self,
        mock_upload_storage,
        client,
        mock_verified_user,
    ):
        """Test project images upload exceeding limit."""
        # Setup mocks - service will raise HTTPException
        from fastapi import HTTPException

        mock_upload_storage.side_effect = HTTPException(
            status_code=400, detail="Maximum 5 images allowed per upload"
        )

        # Make request with 6 images (exceeds limit of 5)
        files = [
            ("files", (f"test{i}.jpg", b"fake image data", "image/jpeg"))
            for i in range(6)
        ]
        response = client.post("/portfolio/project-images", files=files)

        # Verify response
        assert response.status_code == 400
        assert "Maximum 5 images" in response.json()["detail"]

    @patch("app.routes.portfolio.delete_profile_photo_from_storage")
    @patch("app.routes.portfolio.remove_photo_from_portfolio")
    def test_delete_profile_photo_success(
        self,
        mock_remove_photo,
        mock_delete_storage,
        client,
        mock_verified_user,
    ):
        """Test successful profile photo deletion."""
        # Setup mocks
        mock_delete_storage.return_value = None
        mock_remove_photo.return_value = None

        # Make request
        response = client.delete("/portfolio/profile-photo")

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @patch("app.routes.portfolio.delete_project_image_from_storage")
    def test_delete_project_image_success(
        self,
        mock_delete_storage,
        client,
        mock_verified_user,
    ):
        """Test successful project image deletion."""
        # Setup mocks
        mock_delete_storage.return_value = None

        # Make request with valid user-owned image URL
        image_url = "https://example.com/test_user_123/projects/image.jpg"
        response = client.delete(f"/portfolio/project-images/{image_url}")

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @patch("app.routes.portfolio.delete_project_image_from_storage")
    def test_delete_project_image_unauthorized(
        self,
        mock_delete_storage,
        client,
        mock_verified_user,
    ):
        """Test project image deletion with unauthorized URL."""
        # Setup mocks - service will raise HTTPException
        from fastapi import HTTPException

        mock_delete_storage.side_effect = HTTPException(
            status_code=403, detail="Unauthorized to delete this image"
        )

        # Make request with image URL belonging to different user
        image_url = "https://example.com/other_user_456/projects/image.jpg"
        response = client.delete(f"/portfolio/project-images/{image_url}")

        # Verify response
        assert response.status_code == 403
        assert "Unauthorized" in response.json()["detail"]
