"""
Portfolio API routes for managing user portfolio data.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import logging

from ..auth.middleware import require_verified_email
from ..schemas.auth import UserToken
from ..schemas.portfolio import PortfolioData
from ..services.portfolio_service import get_portfolio_service, FirebaseError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/", response_model=Optional[PortfolioData])
def get_user_portfolio(
    user: UserToken = Depends(require_verified_email),
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
    user: UserToken = Depends(require_verified_email),
):
    """
    Save or update the current user's portfolio data.
    """
    try:
        portfolio_service = get_portfolio_service()
        portfolio_service.store_portfolio_data(user.uid, portfolio_data)
        return {"message": "Portfolio saved successfully"}
    except FirebaseError as e:
        logger.error(f"Firebase error saving portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save portfolio data")
    except Exception as e:
        logger.error(f"Unexpected error saving portfolio for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/", response_model=dict)
def delete_user_portfolio(
    user: UserToken = Depends(require_verified_email),
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
    user: UserToken = Depends(require_verified_email),
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
