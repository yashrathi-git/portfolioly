"""Route package that aggregates all API routers."""

from .api import router as api_router
from .auth import router as auth_router
from .upload import router as upload_router
from .portfolio import router as portfolio_router
from .resume import router as resume_router

__all__ = [
    "api_router",
    "auth_router",
    "upload_router",
    "portfolio_router",
    "resume_router",
]
