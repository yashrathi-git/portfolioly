"""Centralized logging configuration for the backend application."""

import logging
import os
from typing import Optional


def init_logging(level_name: Optional[str] = None) -> None:
    """Initialize root logger and common third-party loggers.

    Args:
        level_name: Optional log level name (e.g., "DEBUG", "INFO"). Defaults to
            LOG_LEVEL env var or INFO if not set.
    """
    resolved_level_name = (level_name or os.getenv("LOG_LEVEL", "INFO")).upper()
    level = getattr(logging, resolved_level_name, logging.INFO)

    # Configure root logger once
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Align common server libraries with the chosen level
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        try:
            logging.getLogger(logger_name).setLevel(level)
        except Exception:
            pass
