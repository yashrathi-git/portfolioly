"""
Legacy main.py - DEPRECATED
Use `python -m app.main` or update your deployment to use the new structure.
"""

from app.main import app

# For backward compatibility, expose the app instance
__all__ = ["app"]
