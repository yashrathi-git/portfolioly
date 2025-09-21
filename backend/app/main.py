"""Main FastAPI application."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .core.config import settings
from .core.firebase import initialize_firebase
from .core.logging_config import init_logging
from .auth.middleware import AuthenticationError, EmailVerificationError
from .routes import api_router, auth_router, upload_router


# Configure logging
init_logging()
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""

    # Initialize Firebase
    initialize_firebase()

    # Create FastAPI app
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        debug=settings.debug,
        description="Portfolioly Backend API with Firebase Authentication",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    @app.exception_handler(AuthenticationError)
    async def auth_exception_handler(request: Request, exc: AuthenticationError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": getattr(exc, "error_code", "AUTH_ERROR"),
            },
        )

    @app.exception_handler(EmailVerificationError)
    async def email_verification_exception_handler(
        request: Request, exc: EmailVerificationError
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": "EMAIL_NOT_VERIFIED",
                "requires_verification": True,
            },
        )

    # Include routers
    app.include_router(api_router)
    app.include_router(auth_router)
    app.include_router(upload_router)

    @app.on_event("startup")
    async def startup_event():
        logger.info(f"Starting {settings.app_name} v{settings.version}")
        logger.info(f"Debug mode: {settings.debug}")
        logger.info(
            f"Email verification required: {settings.require_email_verification}"
        )

    return app


# Create app instance
app = create_app()
