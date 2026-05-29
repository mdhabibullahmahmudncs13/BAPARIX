"""
Authentication Middleware

This module implements JWT token validation middleware that:
- Extracts and validates JWT tokens from Authorization header
- Attaches user object to request.state
- Returns 401 for invalid/expired tokens
- Skips authentication for public endpoints
"""

import jwt
import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.core.auth import validate_jwt_token, get_user_by_id

logger = structlog.get_logger(__name__)


# Public endpoints that don't require authentication
PUBLIC_ENDPOINTS = {
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/metrics",
}


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Validates JWT tokens and attaches user context to requests.
    
    Flow:
    1. Check if endpoint is public (skip auth)
    2. Extract token from Authorization header
    3. Validate token signature and expiration
    4. Query user from database
    5. Attach user object to request.state
    6. Reject with 401 if invalid
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through authentication middleware.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler in chain
        
        Returns:
            Response from next handler or 401 error response
        """
        # Skip authentication for public endpoints
        if self._is_public_endpoint(request.url.path):
            logger.debug(
                "skipping_auth_for_public_endpoint",
                path=request.url.path,
            )
            return await call_next(request)
        
        # Extract token from Authorization header
        token = self._extract_token(request)
        
        if not token:
            logger.warning(
                "missing_authorization_token",
                path=request.url.path,
                method=request.method,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Missing authentication token"
                    }
                }
            )
        
        # Validate token and attach user to request
        try:
            # Validate JWT token
            payload = await validate_jwt_token(token)
            user_id = payload["user_id"]
            
            # Get user information from database
            user = await get_user_by_id(user_id)
            
            if not user:
                logger.warning(
                    "user_not_found",
                    user_id=user_id,
                    path=request.url.path,
                )
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "success": False,
                        "error": {
                            "code": "USER_NOT_FOUND",
                            "message": "User not found"
                        }
                    }
                )
            
            # Attach user to request state
            request.state.user = user
            request.state.user_id = user_id
            
            logger.debug(
                "authentication_successful",
                user_id=user_id,
                path=request.url.path,
            )
            
            # Continue to next handler
            return await call_next(request)
        
        except jwt.ExpiredSignatureError:
            logger.warning(
                "token_expired",
                path=request.url.path,
                method=request.method,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": {
                        "code": "TOKEN_EXPIRED",
                        "message": "Authentication token has expired"
                    }
                }
            )
        
        except jwt.InvalidTokenError as e:
            logger.warning(
                "invalid_token",
                error=str(e),
                path=request.url.path,
                method=request.method,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Invalid authentication token"
                    }
                }
            )
        
        except Exception as e:
            logger.error(
                "authentication_error",
                error=str(e),
                error_type=type(e).__name__,
                path=request.url.path,
                method=request.method,
                exc_info=True,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": {
                        "code": "AUTHENTICATION_ERROR",
                        "message": "Authentication failed"
                    }
                }
            )
    
    def _is_public_endpoint(self, path: str) -> bool:
        """
        Check if endpoint is public and doesn't require authentication.
        
        Args:
            path: Request URL path
        
        Returns:
            bool: True if endpoint is public, False otherwise
        """
        # Check exact matches
        if path in PUBLIC_ENDPOINTS:
            return True
        
        # Check if path starts with API v1 prefix (for OpenAPI docs)
        if path.startswith(f"{settings.API_V1_PREFIX}/openapi.json"):
            return True
        
        return False
    
    def _extract_token(self, request: Request) -> str | None:
        """
        Extract JWT token from Authorization header.
        
        Supports both "Bearer <token>" and "<token>" formats.
        
        Args:
            request: FastAPI request object
        
        Returns:
            str | None: JWT token if found, None otherwise
        """
        authorization = request.headers.get("Authorization")
        
        if not authorization:
            return None
        
        # Handle "Bearer <token>" format
        if authorization.startswith("Bearer "):
            return authorization[7:]  # Remove "Bearer " prefix
        
        # Handle plain token format
        return authorization
