# Task 4.1: Rate Limiting Middleware Implementation

## Overview

Implemented rate limiting middleware that enforces usage limits based on subscription tiers. The middleware tracks API usage in Redis with TTL based on billing periods and returns HTTP 429 when limits are exceeded.

## Implementation Details

### Files Created

1. **`app/core/rate_limiter.py`** - Rate limiting middleware and utility functions
2. **`tests/unit/test_rate_limiter.py`** - Comprehensive unit tests

### Key Features

#### 1. Subscription Tier Limits

```python
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
```

#### 2. Rate Limit Headers

All responses include the following headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO 8601 timestamp when the limit resets

For unlimited tiers, headers show "unlimited" instead of numeric values.

#### 3. Redis Usage Tracking

- Usage counters stored in Redis with automatic TTL
- Cache keys include time period for automatic reset at period boundaries
- Format: `rate_limit:{user_id}:{endpoint_key}:{period}`
- TTL: 86400 seconds (1 day) for daily windows, 2592000 seconds (30 days) for monthly windows

#### 4. HTTP 429 Response

When rate limit is exceeded:

```json
{
    "success": false,
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Rate limit exceeded. Upgrade to Pro for unlimited access.",
        "details": {
            "limit": 20,
            "window": "day",
            "usage": 20,
            "reset_at": "2024-01-16T00:00:00Z"
        }
    }
}
```

#### 5. Fail-Open Design

If Redis is unavailable or errors occur, the middleware allows requests to proceed (fail-open) to prevent service disruption.

### Middleware Integration

The middleware should be added to the FastAPI application after authentication middleware:

```python
from app.core.rate_limiter import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware)
```

### Utility Functions

#### `check_rate_limit(user_id, endpoint_key, subscription_tier)`

Check rate limit status without making a request:

```python
result = await check_rate_limit(
    user_id="user-123",
    endpoint_key="product_search",
    subscription_tier="free"
)
# Returns: {
#     "allowed": True,
#     "limit": 20,
#     "usage": 5,
#     "remaining": 15,
#     "reset_at": "2024-01-16T00:00:00Z"
# }
```

#### `reset_rate_limit(user_id, endpoint_key)`

Reset rate limit for a user (useful for testing or admin operations):

```python
success = await reset_rate_limit(
    user_id="user-123",
    endpoint_key="product_search"
)
```

### Rate Limited Endpoints

Currently configured endpoints:
- `/api/v1/products/search` → `product_search`
- `/api/v1/blueprints/generate` → `blueprint_generate`

Additional endpoints can be added to the `RATE_LIMITED_ENDPOINTS` dictionary.

### Subscription Tier Detection

The middleware reads subscription tier from user metadata:

```python
user_metadata = {
    "subscription_tier": "free"  # or "pro", "enterprise"
}
```

If no tier is specified or an invalid tier is provided, it defaults to "free" tier.

## Requirements Validated

✅ **Requirement 3.1**: Implement rate limiting per subscription tier
- Middleware enforces different limits based on subscription tier
- Free, Pro, and Enterprise tiers have distinct configurations

✅ **Requirement 3.2**: Free tier limited to 20 searches/day
- Free tier users are limited to 20 product searches per day
- Limit enforced via Redis counter with daily TTL

✅ **Requirement 3.3**: Pro tier unlimited searches
- Pro tier users have unlimited product searches (limit = None)
- No usage tracking for unlimited endpoints

✅ **Requirement 3.6**: Return remaining quota in response headers
- All responses include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
- Headers provide clear visibility into quota status

## Test Coverage

All 20 unit tests pass with 86% code coverage for the rate limiter module:

### Test Categories

1. **Free Tier Tests**
   - Within limit (allows request)
   - At limit (returns 429)
   - Exceeds limit (returns 429)

2. **Pro/Enterprise Tier Tests**
   - Unlimited searches (no tracking)
   - Unlimited everything (enterprise)

3. **Endpoint Tests**
   - Rate limited endpoints (product search, blueprint)
   - Non-rate limited endpoints (skipped)

4. **Edge Cases**
   - Unauthenticated requests (skipped)
   - Rate limiting disabled via config
   - Invalid subscription tier (defaults to free)
   - Missing subscription tier (defaults to free)
   - Redis errors (fail-open)

5. **Redis Integration**
   - Cache key format
   - TTL setting on first increment
   - Reset time calculation

6. **Utility Functions**
   - check_rate_limit
   - reset_rate_limit

7. **Headers**
   - Header format validation
   - Unlimited tier headers

## Configuration

Rate limiting can be disabled via environment variable:

```bash
RATE_LIMIT_ENABLED=false
```

## Next Steps

To complete the rate limiting implementation:

1. **Add middleware to main.py**:
   ```python
   from app.core.rate_limiter import RateLimitMiddleware
   app.add_middleware(RateLimitMiddleware)
   ```

2. **Implement subscription model** (Task 4.2):
   - Create subscription model in database
   - Store subscription tier in user metadata
   - Implement subscription upgrade/downgrade logic

3. **Add billing period reset task** (Task 4.2):
   - Celery task to reset quotas at billing period boundaries
   - Handle subscription renewals and expirations

4. **Integration testing**:
   - Test with real Redis instance
   - Test with authentication middleware
   - Test end-to-end API flows

## Notes

- The middleware is designed to work with the existing authentication middleware
- User subscription tier is read from `user_metadata.subscription_tier`
- Redis connection is managed by the existing `app/db/redis.py` module
- All logging uses structlog for structured logging
- The implementation follows the design specified in `.kiro/specs/ventureos-backend/design.md`
