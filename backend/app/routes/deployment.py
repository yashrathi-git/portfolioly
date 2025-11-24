"""
Deployment API routes for storing Vercel deployment information.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import logging

from ..dependencies.rate_limiting import rate_limited_core_user
from ..schemas.auth import UserToken
from ..services.deployment_service import (
    get_deployment_service,
    DeploymentServiceError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/deployment", tags=["deployment"])


class SaveDeploymentRequest(BaseModel):
    """Request body for saving deployment information."""

    deployed_url: str
    deployment_dashboard_url: str | None = None
    project_dashboard_url: str | None = None
    project_name: str | None = None
    repository_url: str | None = None


@router.post("")
def save_deployment(
    request: SaveDeploymentRequest,
    user: UserToken = Depends(rate_limited_core_user),
):
    """Save Vercel deployment URL for a user."""
    try:
        deployment_service = get_deployment_service()
        deployment_service.save_deployment(
            user_id=user.uid,
            deployed_url=request.deployed_url,
            deployment_dashboard_url=request.deployment_dashboard_url,
            project_dashboard_url=request.project_dashboard_url,
            project_name=request.project_name,
            repository_url=request.repository_url,
        )

        return {"success": True, "deployed_url": request.deployed_url}

    except DeploymentServiceError as e:
        logger.error(f"Deployment service error for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save deployment")
    except Exception as e:
        logger.error(f"Unexpected error saving deployment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
