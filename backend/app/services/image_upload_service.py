"""Service for handling image upload operations."""

import logging
from typing import List, Optional
from io import BytesIO
from fastapi import UploadFile, HTTPException

from ..utils.image_validation import validate_image_upload
from ..utils.image_optimization import optimize_image
from ..utils.upload_file_wrapper import OptimizedUploadFile
from ..services.azure_blob_storage import get_azure_blob_storage_service
from ..services.portfolio_service import get_portfolio_service
from ..schemas.portfolio import PersonalInfo, PortfolioData
from ..core.config import settings

logger = logging.getLogger(__name__)


async def process_and_create_upload_file(
    file: UploadFile,
) -> tuple[OptimizedUploadFile, str, str]:
    """
    Process an image file: validate, optimize, and create upload wrapper.

    Returns:
        Tuple of (OptimizedUploadFile, filename, content_type)
    """
    # Validate image
    await validate_image_upload(file)

    # Optimize image for web use
    optimized_image_data: BytesIO = await optimize_image(file)

    # Determine filename and content type based on original file
    if file.content_type == "image/gif":
        # GIFs are not optimized, keep original type
        optimized_filename = file.filename or "image.gif"
        optimized_content_type = "image/gif"
    else:
        # Optimized images are converted to WebP
        base_name = file.filename.rsplit(".", 1)[0] if file.filename else "image"
        optimized_filename = f"{base_name}.webp"
        optimized_content_type = "image/webp"

    # Create UploadFile-like object
    optimized_file = OptimizedUploadFile(
        optimized_image_data.getvalue(),
        optimized_filename,
        optimized_content_type,
    )

    return optimized_file, optimized_filename, optimized_content_type


async def upload_profile_photo_to_storage(user_id: str, file: UploadFile) -> str:
    """
    Upload profile photo to Azure Blob Storage.

    Args:
        user_id: User ID
        file: Uploaded image file

    Returns:
        Public URL of uploaded photo

    Raises:
        HTTPException: If upload fails
    """
    # Process and optimize image
    optimized_file, _, _ = await process_and_create_upload_file(file)

    # Upload to Azure Blob Storage
    azure_service = get_azure_blob_storage_service()
    photo_url = await azure_service.upload_profile_photo(
        user_id=user_id, upload_file=optimized_file
    )

    if not photo_url:
        raise HTTPException(
            status_code=500, detail="Failed to upload profile photo to storage"
        )

    return photo_url


async def upload_project_images_to_storage(
    user_id: str, files: List[UploadFile]
) -> List[str]:
    """
    Upload multiple project images to Azure Blob Storage concurrently.

    Args:
        user_id: User ID
        files: List of uploaded image files

    Returns:
        List of public URLs of uploaded images

    Raises:
        HTTPException: If validation fails or all uploads fail
    """
    import asyncio

    # Enforce maximum images limit
    if len(files) > settings.upload.MAX_PROJECT_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.upload.MAX_PROJECT_IMAGES} images allowed per upload",
        )

    # Process all images
    processed_files = []
    for file in files:
        optimized_file, _, _ = await process_and_create_upload_file(file)
        processed_files.append(optimized_file)

    # Upload all images concurrently
    azure_service = get_azure_blob_storage_service()
    upload_tasks = [
        azure_service.upload_project_image(user_id=user_id, upload_file=optimized_file)
        for optimized_file in processed_files
    ]

    uploaded_urls = await asyncio.gather(*upload_tasks)

    # Filter out None values (failed uploads)
    successful_urls = [url for url in uploaded_urls if url]

    if not successful_urls:
        raise HTTPException(status_code=500, detail="All image uploads failed")

    if len(successful_urls) < len(files):
        logger.warning(
            f"Some images failed to upload for user {user_id}: "
            f"{len(successful_urls)}/{len(files)} successful"
        )

    return successful_urls


def update_portfolio_with_photo(user_id: str, photo_url: str) -> None:
    """
    Update user's portfolio data with new profile photo URL.

    Creates a new portfolio if one doesn't exist.

    Args:
        user_id: User ID
        photo_url: Public URL of the profile photo
    """
    portfolio_service = get_portfolio_service()
    portfolio_data = portfolio_service.get_portfolio_data(user_id)

    if portfolio_data:
        # Update existing portfolio
        if portfolio_data.personal_info:
            portfolio_data.personal_info.profile_photo_url = photo_url
        else:
            portfolio_data.personal_info = PersonalInfo(profile_photo_url=photo_url)

        portfolio_service.store_portfolio_data(user_id, portfolio_data)
    else:
        # Create new portfolio with just the photo
        new_portfolio = PortfolioData(
            personal_info=PersonalInfo(profile_photo_url=photo_url)
        )
        portfolio_service.store_portfolio_data(user_id, new_portfolio)


async def delete_profile_photo_from_storage(user_id: str) -> None:
    """
    Delete user's profile photo from Azure Blob Storage.

    Args:
        user_id: User ID
    """
    azure_service = get_azure_blob_storage_service()
    await azure_service.delete_user_profile_photo(user_id)


def remove_photo_from_portfolio(user_id: str) -> None:
    """
    Remove profile photo URL from user's portfolio data.

    Args:
        user_id: User ID
    """
    portfolio_service = get_portfolio_service()
    portfolio_data = portfolio_service.get_portfolio_data(user_id)

    if portfolio_data and portfolio_data.personal_info:
        portfolio_data.personal_info.profile_photo_url = None
        portfolio_service.store_portfolio_data(user_id, portfolio_data)


async def delete_project_image_from_storage(user_id: str, image_url: str) -> None:
    """
    Delete a project image from Azure Blob Storage.

    Verifies ownership before deletion.

    Args:
        user_id: User ID
        image_url: Full URL of the image to delete

    Raises:
        HTTPException: If user doesn't own the image
    """
    # Verify the image URL belongs to this user
    if f"/{user_id}/projects/" not in image_url:
        logger.warning(
            f"User {user_id} attempted to delete image not owned by them: {image_url}"
        )
        raise HTTPException(status_code=403, detail="Unauthorized to delete this image")

    # Delete from Azure Blob Storage
    azure_service = get_azure_blob_storage_service()
    await azure_service.delete_blob_by_url(image_url)
