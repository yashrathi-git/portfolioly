"""
Portfolio API routes for managing user portfolio data.
"""

import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..dependencies.rate_limiting import rate_limited_core_user
from ..schemas.auth import UserToken
from ..schemas.portfolio import PortfolioData
from ..services.portfolio_service import get_portfolio_service, FirebaseError
from ..services.image_upload_service import (
    upload_profile_photo_to_storage,
    upload_project_images_to_storage,
    update_portfolio_with_photo,
    delete_profile_photo_from_storage,
    remove_photo_from_portfolio,
    delete_project_image_from_storage,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _flush_stale_profile_labels(
    new_portfolio: PortfolioData, existing_portfolio: Optional[PortfolioData]
) -> None:
    """
    Flush stale profile labels when URL or type changes.

    When a user updates a profile's URL or type, the old label becomes stale
    and should be cleared. This function modifies the new_portfolio in place,
    clearing labels for profiles where URL or type has changed.

    Args:
        new_portfolio: The incoming portfolio data from the user
        existing_portfolio: The existing portfolio data from storage (if any)
    """
    if not existing_portfolio or not existing_portfolio.personal_info:
        return

    if not new_portfolio.personal_info or not new_portfolio.personal_info.profiles:
        return

    existing_profiles = existing_portfolio.personal_info.profiles or []
    if not existing_profiles:
        return

    # Create lookup of existing profiles by (url, type) tuple
    existing_lookup: Dict[tuple, Any] = {}
    for profile in existing_profiles:
        if profile.url and profile.type:
            key = (profile.url, profile.type)
            existing_lookup[key] = profile

    # Check each new profile and flush label if URL or type changed
    for new_profile in new_portfolio.personal_info.profiles:
        if not new_profile.url or not new_profile.type:
            continue

        key = (new_profile.url, new_profile.type)
        existing_profile = existing_lookup.get(key)

        if not existing_profile:
            # URL or type changed (no exact match found) - flush the label
            new_profile.label = None
            logger.debug(
                f"Flushed stale label for profile: {new_profile.type} - {new_profile.url}"
            )
        # If exact match exists, keep whatever label the user provided


@router.get("/", response_model=Optional[PortfolioData])
def get_user_portfolio(
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Get the current user's portfolio data.
    Returns null if no portfolio exists.
    """
    try:
        portfolio_service = get_portfolio_service()
        portfolio_data = portfolio_service.get_portfolio_data(user.uid)
        return portfolio_data
    except FirebaseError as e:
        logger.error(f"Firebase error getting portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio data")
    except Exception as e:
        logger.error(f"Unexpected error getting portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/", response_model=dict)
def save_user_portfolio(
    portfolio_data: PortfolioData,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Save or update the current user's portfolio data.

    This endpoint handles profile label flushing: when a user updates a profile's
    URL or type, any stale labels are automatically cleared to prevent displaying
    incorrect information.
    """
    try:
        portfolio_service = get_portfolio_service()

        # Get existing portfolio to compare profiles
        existing_portfolio = portfolio_service.get_portfolio_data(user.uid)

        # Flush stale profile labels when URL or type changes
        _flush_stale_profile_labels(portfolio_data, existing_portfolio)

        # Store with preserve_brandfetch=False to avoid unintended merging
        portfolio_service.store_portfolio_data(
            user.uid, portfolio_data, preserve_brandfetch=False
        )

        return {"message": "Portfolio saved successfully"}
    except FirebaseError as e:
        logger.error(f"Firebase error saving portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save portfolio data")
    except Exception as e:
        logger.error(f"Unexpected error saving portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/", response_model=dict)
def delete_user_portfolio(
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Delete the current user's portfolio data.
    """
    try:
        portfolio_service = get_portfolio_service()
        portfolio_service.delete_portfolio_data(user.uid)
        return {"message": "Portfolio deleted successfully"}
    except FirebaseError as e:
        logger.error(f"Firebase error deleting portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete portfolio data")
    except Exception as e:
        logger.error(f"Unexpected error deleting portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/exists", response_model=dict)
def check_portfolio_exists(
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Check if the current user has an existing portfolio.
    """
    try:
        portfolio_service = get_portfolio_service()
        exists = portfolio_service.portfolio_exists(user.uid)
        return {"exists": exists}
    except FirebaseError as e:
        logger.error(
            f"Firebase error checking portfolio existence for user {user.uid}: {e}"
        )
        raise HTTPException(
            status_code=500, detail="Failed to check portfolio existence"
        )
    except Exception as e:
        logger.error(
            f"Unexpected error checking portfolio existence for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/profile-photo", response_model=dict)
async def upload_profile_photo(
    file: UploadFile = File(...),
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Upload or replace user's profile photo.

    The image will be validated, optimized for web use, and stored in Azure Blob Storage.
    The portfolio data will be updated with the new photo URL.
    """
    try:
        # Upload to storage
        photo_url = await upload_profile_photo_to_storage(user.uid, file)

        # Update portfolio data
        update_portfolio_with_photo(user.uid, photo_url)

        logger.info(f"Profile photo uploaded successfully for user {user.uid}")
        return {"photo_url": photo_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload profile photo for user {user.uid}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload profile photo")


@router.post("/project-images", response_model=dict)
async def upload_project_images(
    files: List[UploadFile] = File(...),
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Upload multiple project images (max 5).

    Images will be validated, optimized, and uploaded concurrently for better performance.
    """
    try:
        # Upload all images
        successful_urls = await upload_project_images_to_storage(user.uid, files)

        logger.info(
            f"Uploaded {len(successful_urls)} project images for user {user.uid}"
        )
        return {"image_urls": successful_urls}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload project images for user {user.uid}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload project images")


@router.delete("/profile-photo", response_model=dict)
async def delete_profile_photo(
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Delete user's profile photo from storage and portfolio data.
    """
    try:
        # Delete from storage
        await delete_profile_photo_from_storage(user.uid)

        # Remove from portfolio data
        remove_photo_from_portfolio(user.uid)

        logger.info(f"Profile photo deleted successfully for user {user.uid}")
        return {"success": True, "message": "Profile photo deleted successfully"}

    except Exception as e:
        logger.error(f"Failed to delete profile photo for user {user.uid}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete profile photo")


@router.delete("/project-images/{image_url:path}", response_model=dict)
async def delete_project_image(
    image_url: str,
    user: UserToken = Depends(rate_limited_core_user),
):
    """
    Delete a specific project image from storage.

    Verifies that the image belongs to the requesting user before deletion.
    """
    try:
        # Delete with ownership verification
        await delete_project_image_from_storage(user.uid, image_url)

        logger.info(
            f"Project image deleted successfully for user {user.uid}: {image_url}"
        )
        return {"success": True, "message": "Project image deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project image for user {user.uid}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete project image")
