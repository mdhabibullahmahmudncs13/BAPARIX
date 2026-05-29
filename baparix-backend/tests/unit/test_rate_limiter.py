"""
Unit Tests for Rate Limiting Middleware

Tests rate limiting functionality including:
- Free tier limits (20 searches/day)
- Pro tier unlimited searches
- Rate limit headers
- Redis usage tracking
- Billing period resets
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.core.rate_limiter import (
    RateLimitMiddleware,
    RATE_LIMITS,
    check_rate_limit,
    reset_rate_limit,
)


@pytest.fixture
def mock_redis_client():
    """Mock Redis client for testing."""
    client = AsyncMock()
    client.get = AsyncMock(return_value=None)
    client.incr = AsyncMock(return_value=1)
    client.ttl = AsyncMock(return_value=-1)
    client.expire = AsyncMock(return_value=True)
    client.delete = AsyncMock(return_value=1)
    return client


@pytest.fixture
def mock_request():
    """Create mock request object."""
    request = MagicMock(spec=Request)
    request.url.path = "/api/v1/products/search"
    request.state.user = {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "user_metadata": {
            "subscription_tier": "free"
        }
    }
    return request


@pytest.fixture
def rate_limit_middleware():
    """Create rate limit middleware instance."""
    return RateLimitMiddleware(app=None)


@pytest.mark.asyncio
async def test_free_tier_within_limit(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that free tier user within limit can make requests."""
    # Mock Redis to return usage of 10 (below limit of 20)
    mock_redis_client.get.return_value = b"10"
    
    # Mock call_next to return success response
    async def mock_call_next(request):
        response = JSONResponse(content={"success": True})
        return response
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should have rate limit headers
    assert "X-RateLimit-Limit" in response.headers
    assert response.headers["X-RateLimit-Limit"] == "20"
    assert "X-RateLimit-Remaining" in response.headers
    assert int(response.headers["X-RateLimit-Remaining"]) == 9  # 20 - 10 - 1
    assert "X-RateLimit-Reset" in response.headers
    
    # Should increment usage
    mock_redis_client.incr.assert_called_once()


@pytest.mark.asyncio
async def test_free_tier_at_limit(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that free tier user at limit gets 429 response."""
    # Mock Redis to return usage of 20 (at limit)
    mock_redis_client.get.return_value = b"20"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should return 429
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    
    # Should have error message
    content = response.body.decode()
    assert "RATE_LIMIT_EXCEEDED" in content
    
    # Should have rate limit headers
    assert response.headers["X-RateLimit-Limit"] == "20"
    assert response.headers["X-RateLimit-Remaining"] == "0"
    assert "X-RateLimit-Reset" in response.headers
    
    # Should NOT increment usage
    mock_redis_client.incr.assert_not_called()


@pytest.mark.asyncio
async def test_free_tier_exceeds_limit(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that free tier user exceeding limit gets 429 response."""
    # Mock Redis to return usage of 25 (over limit)
    mock_redis_client.get.return_value = b"25"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should return 429
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    
    # Should NOT increment usage
    mock_redis_client.incr.assert_not_called()


@pytest.mark.asyncio
async def test_pro_tier_unlimited_searches(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that pro tier user has unlimited searches."""
    # Set user to pro tier
    mock_request.state.user["user_metadata"]["subscription_tier"] = "pro"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should have unlimited headers
    assert response.headers["X-RateLimit-Limit"] == "unlimited"
    assert response.headers["X-RateLimit-Remaining"] == "unlimited"
    
    # Should NOT check or increment usage
    mock_redis_client.get.assert_not_called()
    mock_redis_client.incr.assert_not_called()


@pytest.mark.asyncio
async def test_enterprise_tier_unlimited_everything(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that enterprise tier user has unlimited access."""
    # Set user to enterprise tier
    mock_request.state.user["user_metadata"]["subscription_tier"] = "enterprise"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should have unlimited headers
    assert response.headers["X-RateLimit-Limit"] == "unlimited"
    assert response.headers["X-RateLimit-Remaining"] == "unlimited"


@pytest.mark.asyncio
async def test_non_rate_limited_endpoint(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that non-rate-limited endpoints are not checked."""
    # Change to non-rate-limited endpoint
    mock_request.url.path = "/api/v1/users/profile"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should NOT have rate limit headers
    assert "X-RateLimit-Limit" not in response.headers
    
    # Should NOT check usage
    mock_redis_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_unauthenticated_request(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that unauthenticated requests skip rate limiting."""
    # Remove user from request state
    mock_request.state.user = None
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should NOT check usage
    mock_redis_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_rate_limit_disabled(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that rate limiting can be disabled via config."""
    with patch("app.core.rate_limiter.settings.RATE_LIMIT_ENABLED", False):
        async def mock_call_next(request):
            return JSONResponse(content={"success": True})
        
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should NOT check usage
    mock_redis_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_redis_cache_key_format(rate_limit_middleware):
    """Test that Redis cache keys are formatted correctly."""
    user_id = "test-user-123"
    endpoint_key = "product_search"
    
    # Test daily window
    cache_key_day = rate_limit_middleware._get_cache_key(user_id, endpoint_key, "day")
    assert cache_key_day.startswith(f"rate_limit:{user_id}:{endpoint_key}:")
    assert len(cache_key_day.split(":")) == 4
    
    # Test monthly window
    cache_key_month = rate_limit_middleware._get_cache_key(user_id, endpoint_key, "month")
    assert cache_key_month.startswith(f"rate_limit:{user_id}:{endpoint_key}:")
    assert len(cache_key_month.split(":")) == 4


@pytest.mark.asyncio
async def test_ttl_set_on_first_increment(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that TTL is set when counter is first incremented."""
    # Mock Redis to return no existing value
    mock_redis_client.get.return_value = None
    mock_redis_client.ttl.return_value = -1  # No TTL set
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should set TTL
    mock_redis_client.expire.assert_called_once()
    
    # TTL should be 86400 seconds (1 day) for daily window
    call_args = mock_redis_client.expire.call_args
    assert call_args[0][1] == 86400


@pytest.mark.asyncio
async def test_reset_time_calculation(rate_limit_middleware):
    """Test that reset time is calculated correctly."""
    # Test daily reset
    reset_day = rate_limit_middleware._get_reset_time("day")
    assert reset_day.endswith("Z")
    assert "T00:00:00" in reset_day
    
    # Test monthly reset
    reset_month = rate_limit_middleware._get_reset_time("month")
    assert reset_month.endswith("Z")
    assert "-01T00:00:00" in reset_month


@pytest.mark.asyncio
async def test_check_rate_limit_utility_function(mock_redis_client):
    """Test the check_rate_limit utility function."""
    mock_redis_client.get.return_value = b"5"
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        result = await check_rate_limit(
            user_id="test-user-123",
            endpoint_key="product_search",
            subscription_tier="free"
        )
    
    assert result["allowed"] is True
    assert result["limit"] == 20
    assert result["usage"] == 5
    assert result["remaining"] == 15
    assert result["reset_at"] is not None


@pytest.mark.asyncio
async def test_check_rate_limit_unlimited(mock_redis_client):
    """Test check_rate_limit for unlimited tier."""
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        result = await check_rate_limit(
            user_id="test-user-123",
            endpoint_key="product_search",
            subscription_tier="pro"
        )
    
    assert result["allowed"] is True
    assert result["limit"] is None
    assert result["remaining"] is None


@pytest.mark.asyncio
async def test_reset_rate_limit_utility_function(mock_redis_client):
    """Test the reset_rate_limit utility function."""
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        result = await reset_rate_limit(
            user_id="test-user-123",
            endpoint_key="product_search"
        )
    
    assert result is True
    
    # Should delete keys for both day and month windows
    assert mock_redis_client.delete.call_count == 2


@pytest.mark.asyncio
async def test_invalid_subscription_tier_defaults_to_free(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that invalid subscription tier defaults to free."""
    # Set invalid tier
    mock_request.state.user["user_metadata"]["subscription_tier"] = "invalid_tier"
    
    # Mock Redis to return usage of 20 (at free tier limit)
    mock_redis_client.get.return_value = b"20"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should apply free tier limits (return 429)
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.asyncio
async def test_missing_subscription_tier_defaults_to_free(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that missing subscription tier defaults to free."""
    # Remove subscription tier from metadata
    mock_request.state.user["user_metadata"] = {}
    
    # Mock Redis to return usage of 20 (at free tier limit)
    mock_redis_client.get.return_value = b"20"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should apply free tier limits (return 429)
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.asyncio
async def test_redis_error_fails_open(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that Redis errors allow requests (fail open)."""
    # Mock Redis to raise error
    mock_redis_client.get.side_effect = Exception("Redis connection error")
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request despite error
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_blueprint_endpoint_rate_limiting(mock_redis_client, mock_request, rate_limit_middleware):
    """Test rate limiting for blueprint generation endpoint."""
    # Change to blueprint endpoint
    mock_request.url.path = "/api/v1/blueprints/generate"
    
    # Mock Redis to return usage of 1 (at free tier limit for blueprints)
    mock_redis_client.get.return_value = b"1"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should return 429 (free tier limit is 1 blueprint/month)
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.asyncio
async def test_rate_limit_headers_format(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that rate limit headers are formatted correctly."""
    mock_redis_client.get.return_value = b"5"
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Check header formats
    assert response.headers["X-RateLimit-Limit"].isdigit()
    assert response.headers["X-RateLimit-Remaining"].isdigit()
    assert "T" in response.headers["X-RateLimit-Reset"]  # ISO 8601 format
    assert response.headers["X-RateLimit-Reset"].endswith("Z")


@pytest.mark.asyncio
async def test_first_request_initializes_counter(mock_redis_client, mock_request, rate_limit_middleware):
    """Test that first request initializes usage counter."""
    # Mock Redis to return no existing value
    mock_redis_client.get.return_value = None
    
    async def mock_call_next(request):
        return JSONResponse(content={"success": True})
    
    with patch("app.core.rate_limiter.get_client", return_value=mock_redis_client):
        response = await rate_limit_middleware.dispatch(mock_request, mock_call_next)
    
    # Should allow request
    assert response.status_code == 200
    
    # Should increment counter
    mock_redis_client.incr.assert_called_once()
    
    # Should set TTL
    mock_redis_client.expire.assert_called_once()
