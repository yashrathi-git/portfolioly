"""Image validation utilities for file uploads."""

from fastapi import UploadFile, HTTPException
from ..core.config import settings


async def validate_image_upload(file: UploadFile) -> None:
    """
    Validate image file size and type.

    Args:
        file: The uploaded file to validate

    Raises:
        HTTPException: If validation fails with appropriate error message
    """
    # Check content type
    if file.content_type not in settings.upload.ALLOWED_IMAGE_TYPES:
        allowed_types = ", ".join(settings.upload.ALLOWED_IMAGE_TYPES)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed types: {allowed_types}",
        )

    # Check file size
    contents = await file.read()
    file_size_kb = len(contents) / 1024

    if len(contents) > settings.upload.MAX_IMAGE_SIZE_BYTES:
        max_size_kb = settings.upload.MAX_IMAGE_SIZE_BYTES / 1024
        raise HTTPException(
            status_code=400,
            detail=f"Image size exceeds {max_size_kb:.0f}KB (current: {file_size_kb:.0f}KB)",
        )

    # Reset file pointer for subsequent reads
    await file.seek(0)


def validate_image_caption(caption: str) -> None:
    """
    Validate image caption length.

    Args:
        caption: The caption text to validate

    Raises:
        HTTPException: If caption exceeds maximum length
    """
    if len(caption) > settings.upload.MAX_IMAGE_CAPTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Caption exceeds maximum length of {settings.upload.MAX_IMAGE_CAPTION_LENGTH} characters",
        )
