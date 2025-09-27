"""
Public portfolio API routes for accessing published portfolios.
"""

from fastapi import APIRouter, HTTPException, Path
from typing import Optional
import logging

from ..schemas.portfolio import PortfolioData
from ..services.portfolio_service import get_portfolio_service, FirebaseError
from ..services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["public-portfolio"])


@router.get("/portfolio/{username}", response_model=Optional[PortfolioData])
def get_public_portfolio(
    username: str = Path(..., description="Username of the portfolio to retrieve"),
):
    """
    Get a public portfolio by username.
    Returns 404 if the portfolio doesn't exist or is private.
    """
    try:
        user_settings_service = get_user_settings_service()
        portfolio_service = get_portfolio_service()

        # First, check if the username exists and portfolio is public
        user_settings = user_settings_service.get_user_settings_by_username(username)

        if not user_settings:
            logger.info(f"Username '{username}' not found")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        if not user_settings.get("is_public", False):
            logger.info(f"Portfolio for username '{username}' is private")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Get the user ID from settings
        user_id = user_settings.get("user_id")
        if not user_id:
            logger.error(f"No user_id found for username '{username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Fetch the portfolio data
        portfolio_data = portfolio_service.get_portfolio_data(user_id)

        if not portfolio_data:
            logger.info(
                f"No portfolio data found for user_id '{user_id}' (username: '{username}')"
            )
            raise HTTPException(status_code=404, detail="Portfolio not found")

        logger.info(
            f"Successfully retrieved public portfolio for username '{username}'"
        )
        return portfolio_data

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error for username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")
    except FirebaseError as e:
        logger.error(
            f"Firebase error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")
    except Exception as e:
        logger.error(
            f"Unexpected error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/username/{username}/available", response_model=dict)
def check_username_availability(
    username: str = Path(..., description="Username to check availability for"),
):
    """
    Check if a username is available for registration.
    Returns {"available": true/false}
    """
    try:
        user_settings_service = get_user_settings_service()

        # Validate username format
        validation_result = user_settings_service.validate_username(username)
        if not validation_result["valid"]:
            return {
                "available": False,
                "reason": validation_result.get("error", "Invalid username format"),
            }

        # Check if username is already taken
        existing_settings = user_settings_service.get_user_settings_by_username(
            username
        )
        is_available = existing_settings is None

        logger.info(f"Username '{username}' availability check: {is_available}")

        result = {"available": is_available}
        if not is_available:
            result["reason"] = "Username is already taken"

        return result

    except UserSettingsError as e:
        logger.error(f"User settings error checking username '{username}': {e}")
        raise HTTPException(
            status_code=500, detail="Failed to check username availability"
        )
    except Exception as e:
        logger.error(f"Unexpected error checking username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
