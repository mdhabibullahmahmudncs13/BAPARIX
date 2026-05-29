"""
Rate Limiting Module

This module implements rate limiting middleware that enforces usage limits
based on subscription tiers. It tracks API usage in Redis with TTL based on
billing periods and returns HTTP 429 when limits are exceeded.

Requirements:
- 3.1: Implement rate limiting per subscription tier
- 3.2: Free tier limited to 20 searches/day
- 3.3: Pro tier unlimited searches
- 3.6: Return remaining quota in response headers
"""

import hashlib
import structlog
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.db.redis import get_client
from app.config import settings

logger = structlog.get_logger(__name__)


# Rate limit configurations per subscription tier
RATE_LIMITS = {
    "free": {
        "product_search": {"limit": 20, "window": "day"},
        "blueprint_generate": {"limit": 1, "window": "month"}
    },
    "pro": {
        "product_search": {"limit": None, "window": None},  # Unlimited
        "blueprint_generate": {"limit": 10, "window": "month"}
    },
    "enterprise": {
        "product_search": {"limit": None, "window": None},  # Unlimited
        "blueprint_generate": {"limit": None, "window": None}  # Unlimited
    }
}


# Endpoint to rate limit key mapping
RATE_LIMITED_ENDPOINTS = {
    "/api/v1/products/search": "product_search",
    "/api/v1/blueprints/generate": "blueprint_generate",
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforces rate limits based on subscription tier.
    
    Limits:
    - Free tier: 20 product searches/day, 1 blueprint/month
    - Pro tier: Unlimited searches, 10 blueprints/month
    - Enterprise tier: Unlimited everything
    
    Tracks usage in Redis with TTL based on billing period.
    Returns HTTP 429 when limits exceeded with reset time in headers.
    Adds X-RateLimit-* headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through rate limiting middleware.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/handler in chain
        
        Returns:
            Response from next handler or 429 error response
        """
        # Skip rate limiting if not enabled
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Skip rate limiting for non-authenticated requests
        # (auth middleware will handle these)
        if not hasattr(request.state, "user") or not request.state.user:
            return await call_next(request)
        
        # Get endpoint key for rate limiting
        endpoint_key = self._get_endpoint_key(request.url.path)
        
        # Skip if endpoint is not rate limited
        if not endpoint_key:
            return await call_next(request)
        
        user = request.state.user
        user_id = user.get("user_id")
        
        # Get subscription tier (default to free if not specified)
        subscription_tier = self._get_subscription_tier(user)
        
        # Get rate limit configuration for this tier and endpoint
        limit_config = RATE_LIMITS.get(subscription_tier, {}).get(endpoint_key)
        
        if not limit_config:
            # No rate limit configured for this tier/endpoint
            return await call_next(request)
        
        # Check if this tier has unlimited access
        if limit_config["limit"] is None:
            logger.debug(
                "rate_limit_unlimited",
                user_id=user_id,
                tier=subscription_tier,
                endpoint=endpoint_key,
            )
            # Add headers indicating unlimited access
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = "unlimited"
            response.headers["X-RateLimit-Remaining"] = "unlimited"
            return response
        
        # Get current usage
        usage = await self._get_usage(user_id, endpoint_key, limit_config["window"])
        limit = limit_config["limit"]
        
        # Check if limit exceeded
        if usage >= limit:
            reset_time = self._get_reset_time(limit_config["window"])
            
            logger.warning(
                "rate_limit_exceeded",
                user_id=user_id,
                tier=subscription_tier,
                endpoint=endpoint_key,
                usage=usage,
                limit=limit,
                reset_at=reset_time,
            )
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Upgrade to Pro for unlimited access.",
                        "details": {
                            "limit": limit,
                            "window": limit_config["window"],
                            "usage": usage,
                            "reset_at": reset_time
                        }
                    }
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": reset_time,
                }
            )
        
        # Increment usage counter
        await self._increment_usage(user_id, endpoint_key, limit_config["window"])
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        remaining = limit - usage - 1
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = self._get_reset_time(limit_config["window"])
        
        logger.debug(
            "rate_limit_check_passed",
            user_id=user_id,
            tier=subscription_tier,
            endpoint=endpoint_key,
            usage=usage + 1,
            limit=limit,
            remaining=remaining,
        )
        
        return response
    
    def _get_endpoint_key(self, path: str) -> Optional[str]:
        """
        Get rate limit endpoint key from request path.
        
        Args:
            path: Request URL path
        
        Returns:
            str | None: Endpoint key if rate limited, None otherwise
        """
        # Check exact matches
        if path in RATE_LIMITED_ENDPOINTS:
            return RATE_LIMITED_ENDPOINTS[path]
        
        # Check prefix matches (for endpoints with path parameters)
        for endpoint_path, key in RATE_LIMITED_ENDPOINTS.items():
            if path.startswith(endpoint_path):
                return key
        
        return None
    
    def _get_subscription_tier(self, user: Dict[str, Any]) -> str:
        """
        Get user's subscription tier.
        
        Args:
            user: User object from request.state
        
        Returns:
            str: Subscription tier (free, pro, enterprise)
        """
        # Check if user has subscription info in metadata
        user_metadata = user.get("user_metadata", {})
        tier = user_metadata.get("subscription_tier", "free")
        
        # Validate tier
        if tier not in RATE_LIMITS:
            logger.warning(
                "invalid_subscription_tier",
                user_id=user.get("user_id"),
                tier=tier,
            )
            return "free"
        
        return tier
    
    async def _get_usage(self, user_id: str, endpoint_key: str, window: str) -> int:
        """
        Get current usage count for user and endpoint.
        
        Args:
            user_id: User's unique identifier
            endpoint_key: Rate limit endpoint key
            window: Time window (day, month)
        
        Returns:
            int: Current usage count
        """
        try:
            redis_client = get_client()
            cache_key = self._get_cache_key(user_id, endpoint_key, window)
            
            value = await redis_client.get(cache_key)
            
            if value is None:
                return 0
            
            return int(value)
        
        except Exception as e:
            logger.error(
                "rate_limit_get_usage_error",
                user_id=user_id,
                endpoint=endpoint_key,
                error=str(e),
                exc_info=True,
            )
            # On error, allow request (fail open)
            return 0
    
    async def _increment_usage(self, user_id: str, endpoint_key: str, window: str) -> None:
        """
        Increment usage counter for user and endpoint.
        
        Args:
            user_id: User's unique identifier
            endpoint_key: Rate limit endpoint key
            window: Time window (day, month)
        """
        try:
            redis_client = get_client()
            cache_key = self._get_cache_key(user_id, endpoint_key, window)
            
            # Increment counter
            await redis_client.incr(cache_key)
            
            # Set TTL if this is the first increment
            ttl = await redis_client.ttl(cache_key)
            if ttl == -1:  # Key exists but has no TTL
                window_seconds = self._get_window_seconds(window)
                await redis_client.expire(cache_key, window_seconds)
        
        except Exception as e:
            logger.error(
                "rate_limit_increment_usage_error",
                user_id=user_id,
                endpoint=endpoint_key,
                error=str(e),
                exc_info=True,
            )
            # On error, continue (fail open)
    
    def _get_cache_key(self, user_id: str, endpoint_key: str, window: str) -> str:
        """
        Generate Redis cache key for rate limiting.
        
        Args:
            user_id: User's unique identifier
            endpoint_key: Rate limit endpoint key
            window: Time window (day, month)
        
        Returns:
            str: Redis cache key
        """
        # Include time period in key to auto-reset at period boundaries
        now = datetime.utcnow()
        
        if window == "day":
            period = now.strftime("%Y-%m-%d")
        elif window == "month":
            period = now.strftime("%Y-%m")
        else:
            period = "unknown"
        
        return f"rate_limit:{user_id}:{endpoint_key}:{period}"
    
    def _get_window_seconds(self, window: str) -> int:
        """
        Get TTL in seconds for time window.
        
        Args:
            window: Time window (day, month)
        
        Returns:
            int: TTL in seconds
        """
        if window == "day":
            return 86400  # 24 hours
        elif window == "month":
            return 2592000  # 30 days
        else:
            return 86400  # Default to 1 day
    
    def _get_reset_time(self, window: str) -> str:
        """
        Get reset time for rate limit window.
        
        Args:
            window: Time window (day, month)
        
        Returns:
            str: ISO 8601 formatted reset time
        """
        now = datetime.utcnow()
        
        if window == "day":
            # Reset at midnight UTC
            reset = (now + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        elif window == "month":
            # Reset at start of next month
            if now.month == 12:
                reset = now.replace(year=now.year + 1, month=1, day=1,
                                   hour=0, minute=0, second=0, microsecond=0)
            else:
                reset = now.replace(month=now.month + 1, day=1,
                                   hour=0, minute=0, second=0, microsecond=0)
        else:
            # Default to next day
            reset = (now + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        
        return reset.isoformat() + "Z"


async def check_rate_limit(
    user_id: str,
    endpoint_key: str,
    subscription_tier: str = "free"
) -> Dict[str, Any]:
    """
    Check rate limit for a user and endpoint.
    
    This is a utility function for checking rate limits outside of middleware.
    
    Args:
        user_id: User's unique identifier
        endpoint_key: Rate limit endpoint key
        subscription_tier: User's subscription tier
    
    Returns:
        dict: Rate limit status with fields:
            - allowed: bool (whether request is allowed)
            - limit: int | None (rate limit)
            - usage: int (current usage)
            - remaining: int (remaining requests)
            - reset_at: str (reset time)
    """
    limit_config = RATE_LIMITS.get(subscription_tier, {}).get(endpoint_key)
    
    if not limit_config:
        return {
            "allowed": True,
            "limit": None,
            "usage": 0,
            "remaining": None,
            "reset_at": None,
        }
    
    # Check if unlimited
    if limit_config["limit"] is None:
        return {
            "allowed": True,
            "limit": None,
            "usage": 0,
            "remaining": None,
            "reset_at": None,
        }
    
    # Get current usage
    middleware = RateLimitMiddleware(app=None)
    usage = await middleware._get_usage(user_id, endpoint_key, limit_config["window"])
    limit = limit_config["limit"]
    remaining = max(0, limit - usage)
    allowed = usage < limit
    reset_at = middleware._get_reset_time(limit_config["window"])
    
    return {
        "allowed": allowed,
        "limit": limit,
        "usage": usage,
        "remaining": remaining,
        "reset_at": reset_at,
    }


async def reset_rate_limit(user_id: str, endpoint_key: str) -> bool:
    """
    Reset rate limit for a user and endpoint.
    
    This is a utility function for testing or admin operations.
    
    Args:
        user_id: User's unique identifier
        endpoint_key: Rate limit endpoint key
    
    Returns:
        bool: True if reset successful, False otherwise
    """
    try:
        redis_client = get_client()
        middleware = RateLimitMiddleware(app=None)
        
        # Delete keys for both day and month windows
        for window in ["day", "month"]:
            cache_key = middleware._get_cache_key(user_id, endpoint_key, window)
            await redis_client.delete(cache_key)
        
        logger.info(
            "rate_limit_reset",
            user_id=user_id,
            endpoint=endpoint_key,
        )
        
        return True
    
    except Exception as e:
        logger.error(
            "rate_limit_reset_error",
            user_id=user_id,
            endpoint=endpoint_key,
            error=str(e),
            exc_info=True,
        )
        return False
