"""
Middleware Package

This package contains FastAPI middleware components for authentication,
rate limiting, and request processing.
"""

from app.middleware.auth import AuthMiddleware

__all__ = ["AuthMiddleware"]
