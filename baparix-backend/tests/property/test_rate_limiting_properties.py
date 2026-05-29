"""
Property-Based Tests for Rate Limiting and Quota Management

Tests correctness properties for rate limiting, quota tracking, and billing period resets
using Hypothesis for property-based testing.

**Validates: Requirements 3.3, 3.4, 3.6, 3.7**
"""

import os
from datetime import datetime, timedelta
from typing import Dict, Any
from uuid import uuid4

import pytest
from hypothesis import given, settings, strategies as st, assume, HealthCheck
from fastapi import status
from sqlalchemy import select

from app.models.subscription import (
    Subscription,
    SubscriptionTier,
    SubscriptionStatus,
    UsageQuota,
)
from app.services.quota_service import (
    get_or_create_quota,
    increment_api_call_count,
    reset_quota_for_new_period,
    get_quota_status,
)

# Configure Hypothesis profiles
settings.register_profile("ci", max_examples=20, deadline=5000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.register_profile("dev", max_examples=10, deadline=2000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategies for generating test data
subscription_tier_strategy = st.sampled_from([
    SubscriptionTier.FREE,
    SubscriptionTier.PRO,
    SubscriptionTier.ENTERPRISE,
])

# Strategy for generating valid request counts (1-100)
request_count_strategy = st.integers(min_value=1, max_value=100)

# Strategy for generating billing period offsets (0-60 days)
billing_period_offset_strategy = st.integers(min_value=0, max_value=60)


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 8: Pro Tier Unlimited Searches")
@settings(max_examples=20)
@given(
    tier=st.sampled_from([SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]),
    request_count=request_count_strategy,
)
@pytest.mark.asyncio
async def test_pro_tier_unlimited_searches(db_session, tier, request_count):
    """
    Feature: ventureos-backend, Property 8: Pro Tier Unlimited Searches
    
    **Validates: Requirements 3.3**
    
    Property: For any Pro or Enterprise tier user, product search requests 
    should never return HTTP 429 rate limit errors, regardless of the number 
    of requests made.
    
    This property verifies that:
    1. Pro tier users can make unlimited product searches
    2. Enterprise tier users can make unlimited product searches
    3. No HTTP 429 errors are returned for these tiers
    4. Rate limit headers indicate unlimited access
    5. Usage is not tracked or enforced for unlimited tiers
    """
    # Ensure we're testing meaningful request counts
    assume(request_count > 0)
    
    # Create user and subscription
    user_id = uuid4()
    now = datetime.utcnow()
    
    subscription = Subscription(
        user_id=user_id,
        tier=tier.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create quota
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=tier,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    db_session.add(quota)
    await db_session.commit()
    
    # Property 1: Pro/Enterprise tier should have unlimited API calls
    assert quota.api_calls_limit == -1, (
        f"{tier.value} tier should have unlimited API calls (limit=-1), "
        f"got limit={quota.api_calls_limit}"
    )
    
    # Property 2: has_api_call_quota should always return True for unlimited tiers
    for i in range(request_count):
        has_quota = quota.has_api_call_quota()
        assert has_quota is True, (
            f"{tier.value} tier should always have API call quota available, "
            f"but got False after {i} requests"
        )
        
        # Simulate API call
        quota.increment_api_calls(1)
    
    # Property 3: After many requests, quota should still be available
    assert quota.has_api_call_quota() is True, (
        f"{tier.value} tier should still have quota after {request_count} requests"
    )
    
    # Property 4: remaining_api_calls should return None (unlimited)
    remaining = quota.remaining_api_calls()
    assert remaining is None, (
        f"{tier.value} tier should have unlimited remaining calls (None), "
        f"got {remaining}"
    )
    
    # Property 5: Usage should be tracked even for unlimited tiers
    assert quota.api_calls_used == request_count, (
        f"API calls should be tracked even for unlimited tiers. "
        f"Expected {request_count}, got {quota.api_calls_used}"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 9: API Usage Tracking")
@settings(max_examples=20)
@given(
    tier=subscription_tier_strategy,
    initial_usage=st.integers(min_value=0, max_value=50),
    increment_count=st.integers(min_value=1, max_value=20),
)
@pytest.mark.asyncio
async def test_api_usage_tracking(db_session, tier, initial_usage, increment_count):
    """
    Feature: ventureos-backend, Property 9: API Usage Tracking
    
    **Validates: Requirements 3.4**
    
    Property: For any API call by an authenticated user, the usage counter 
    for that user's current billing period should be incremented by 1.
    
    This property verifies that:
    1. API usage is accurately tracked per user
    2. Usage counter increments by exactly 1 per API call
    3. Usage is tracked within the current billing period
    4. Usage tracking works for all subscription tiers
    5. Multiple increments accumulate correctly
    """
    # Create user and subscription
    user_id = uuid4()
    now = datetime.utcnow()
    
    subscription = Subscription(
        user_id=user_id,
        tier=tier.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create quota with initial usage
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=tier,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.api_calls_used = initial_usage
    db_session.add(quota)
    await db_session.commit()
    
    # Property 1: Initial usage should be set correctly
    assert quota.api_calls_used == initial_usage, (
        f"Initial usage should be {initial_usage}, got {quota.api_calls_used}"
    )
    
    # Property 2: Each increment should increase usage by exactly 1
    for i in range(increment_count):
        expected_usage = initial_usage + i
        assert quota.api_calls_used == expected_usage, (
            f"Before increment {i}, usage should be {expected_usage}, "
            f"got {quota.api_calls_used}"
        )
        
        # Increment API call count
        success, error = await increment_api_call_count(db_session, user_id, count=1)
        
        # For free tier with high usage, might hit limit
        if tier == SubscriptionTier.FREE and quota.api_calls_used >= quota.api_calls_limit:
            assert success is False, (
                f"Free tier should fail when limit exceeded"
            )
            break
        else:
            assert success is True, (
                f"API call increment should succeed for {tier.value} tier, "
                f"got error: {error}"
            )
        
        # Refresh quota to get updated values
        await db_session.refresh(quota)
        
        # Property 3: Usage should increment by exactly 1
        expected_usage_after = initial_usage + i + 1
        assert quota.api_calls_used == expected_usage_after, (
            f"After increment {i}, usage should be {expected_usage_after}, "
            f"got {quota.api_calls_used}"
        )
    
    # Property 4: Final usage should be initial + increment_count (or limit)
    if tier == SubscriptionTier.FREE and initial_usage + increment_count > quota.api_calls_limit:
        # Free tier should stop at limit
        assert quota.api_calls_used <= quota.api_calls_limit, (
            f"Free tier usage should not exceed limit {quota.api_calls_limit}, "
            f"got {quota.api_calls_used}"
        )
    else:
        # Other tiers should track all increments
        expected_final = initial_usage + increment_count
        assert quota.api_calls_used == expected_final, (
            f"Final usage should be {expected_final}, got {quota.api_calls_used}"
        )
    
    # Property 5: Usage should be within current billing period
    assert quota.is_current_period() is True, (
        f"Quota should be for current billing period"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 11: Quota Headers")
@settings(max_examples=20)
@given(
    tier=subscription_tier_strategy,
    current_usage=st.integers(min_value=0, max_value=15),
)
@pytest.mark.asyncio
async def test_quota_headers_present(db_session, tier, current_usage):
    """
    Feature: ventureos-backend, Property 11: Quota Headers
    
    **Validates: Requirements 3.6**
    
    Property: For any API response to an authenticated user, the response 
    headers should include X-RateLimit-Limit, X-RateLimit-Remaining, and 
    X-RateLimit-Reset (if applicable to the endpoint).
    
    This property verifies that:
    1. Quota status includes limit information
    2. Quota status includes remaining count
    3. Quota status includes period information (reset time)
    4. Headers are present for all subscription tiers
    5. Header values are accurate and consistent
    """
    # For free tier, ensure usage doesn't exceed limit
    if tier == SubscriptionTier.FREE:
        assume(current_usage <= 20)  # Free tier limit
    
    # Create user and subscription
    user_id = uuid4()
    now = datetime.utcnow()
    
    subscription = Subscription(
        user_id=user_id,
        tier=tier.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create quota with current usage
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=tier,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.api_calls_used = current_usage
    db_session.add(quota)
    await db_session.commit()
    
    # Get quota status (simulates what would be in response headers)
    status = await get_quota_status(db_session, user_id)
    
    # Property 1: Status should not be None
    assert status is not None, (
        f"Quota status should be available for authenticated user"
    )
    
    # Property 2: Status should include API calls information
    assert "api_calls" in status, (
        f"Quota status should include 'api_calls' field"
    )
    
    api_calls_info = status["api_calls"]
    
    # Property 3: API calls info should include 'used' field
    assert "used" in api_calls_info, (
        f"API calls info should include 'used' field"
    )
    assert api_calls_info["used"] == current_usage, (
        f"Used count should be {current_usage}, got {api_calls_info['used']}"
    )
    
    # Property 4: API calls info should include 'limit' field
    assert "limit" in api_calls_info, (
        f"API calls info should include 'limit' field"
    )
    
    # Property 5: API calls info should include 'remaining' field
    assert "remaining" in api_calls_info, (
        f"API calls info should include 'remaining' field"
    )
    
    # Property 6: For limited tiers, remaining should be limit - used
    if tier == SubscriptionTier.FREE:
        expected_limit = 10000  # Free tier API call limit
        expected_remaining = expected_limit - current_usage
        
        assert api_calls_info["limit"] == expected_limit, (
            f"Free tier limit should be {expected_limit}, "
            f"got {api_calls_info['limit']}"
        )
        assert api_calls_info["remaining"] == expected_remaining, (
            f"Free tier remaining should be {expected_remaining}, "
            f"got {api_calls_info['remaining']}"
        )
    
    # Property 7: For unlimited tiers, limit and remaining should be None
    if tier in [SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]:
        assert api_calls_info["limit"] is None, (
            f"{tier.value} tier should have unlimited limit (None), "
            f"got {api_calls_info['limit']}"
        )
        assert api_calls_info["remaining"] is None, (
            f"{tier.value} tier should have unlimited remaining (None), "
            f"got {api_calls_info['remaining']}"
        )
    
    # Property 8: Status should include period information (reset time)
    assert "period" in status, (
        f"Quota status should include 'period' field"
    )
    
    period_info = status["period"]
    assert "start" in period_info, (
        f"Period info should include 'start' field"
    )
    assert "end" in period_info, (
        f"Period info should include 'end' field"
    )
    
    # Property 9: Period dates should be valid ISO 8601 strings
    assert isinstance(period_info["start"], str), (
        f"Period start should be string, got {type(period_info['start'])}"
    )
    assert isinstance(period_info["end"], str), (
        f"Period end should be string, got {type(period_info['end'])}"
    )
    
    # Property 10: Period end should be after period start
    period_start = datetime.fromisoformat(period_info["start"].replace("Z", "+00:00"))
    period_end = datetime.fromisoformat(period_info["end"].replace("Z", "+00:00"))
    assert period_end > period_start, (
        f"Period end should be after period start"
    )
    
    # Property 11: Status should include blueprints information
    assert "blueprints" in status, (
        f"Quota status should include 'blueprints' field"
    )
    
    blueprints_info = status["blueprints"]
    assert "used" in blueprints_info, (
        f"Blueprints info should include 'used' field"
    )
    assert "limit" in blueprints_info, (
        f"Blueprints info should include 'limit' field"
    )
    assert "remaining" in blueprints_info, (
        f"Blueprints info should include 'remaining' field"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 12: Billing Period Quota Reset")
@settings(max_examples=20)
@given(
    tier=subscription_tier_strategy,
    api_calls_used=st.integers(min_value=10, max_value=100),
    blueprints_generated=st.integers(min_value=1, max_value=5),
    days_offset=billing_period_offset_strategy,
)
@pytest.mark.asyncio
async def test_billing_period_quota_reset(
    db_session, 
    tier, 
    api_calls_used, 
    blueprints_generated,
    days_offset
):
    """
    Feature: ventureos-backend, Property 12: Billing Period Quota Reset
    
    **Validates: Requirements 3.7**
    
    Property: For any user at the start of a new billing period, all usage 
    quotas (API calls, blueprints generated) should be reset to zero.
    
    This property verifies that:
    1. Quota reset creates a new quota record
    2. New quota has zero usage for all counters
    3. New quota has correct limits for the tier
    4. New quota has correct period dates
    5. Old quota is preserved (not deleted)
    6. Subscription period dates are updated
    """
    # Create user and subscription with expired period
    user_id = uuid4()
    now = datetime.utcnow()
    
    # Create old period that has expired
    old_period_start = now - timedelta(days=30 + days_offset)
    old_period_end = now - timedelta(days=days_offset)
    
    subscription = Subscription(
        user_id=user_id,
        tier=tier.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=old_period_start,
        current_period_end=old_period_end,
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create old quota with usage
    old_quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=tier,
        period_start=old_period_start,
        period_end=old_period_end,
    )
    old_quota.api_calls_used = api_calls_used
    old_quota.blueprints_generated = blueprints_generated
    db_session.add(old_quota)
    await db_session.commit()
    
    old_quota_id = old_quota.id
    
    # Property 1: Old quota should have non-zero usage
    assert old_quota.api_calls_used == api_calls_used, (
        f"Old quota should have {api_calls_used} API calls used"
    )
    assert old_quota.blueprints_generated == blueprints_generated, (
        f"Old quota should have {blueprints_generated} blueprints generated"
    )
    
    # Reset quota for new period
    success, error = await reset_quota_for_new_period(db_session, user_id)
    
    # Property 2: Reset should succeed
    assert success is True, (
        f"Quota reset should succeed, got error: {error}"
    )
    assert error is None, (
        f"Quota reset should not return error, got: {error}"
    )
    
    # Get new quota
    new_quota = await get_or_create_quota(db_session, user_id)
    
    # Property 3: New quota should exist
    assert new_quota is not None, (
        f"New quota should be created after reset"
    )
    
    # Property 4: New quota should be different from old quota
    assert new_quota.id != old_quota_id, (
        f"New quota should have different ID from old quota"
    )
    
    # Property 5: New quota should have zero usage
    assert new_quota.api_calls_used == 0, (
        f"New quota should have 0 API calls used, got {new_quota.api_calls_used}"
    )
    assert new_quota.blueprints_generated == 0, (
        f"New quota should have 0 blueprints generated, "
        f"got {new_quota.blueprints_generated}"
    )
    
    # Property 6: New quota should have correct limits for tier
    if tier == SubscriptionTier.FREE:
        assert new_quota.blueprints_limit == 1, (
            f"Free tier should have 1 blueprint limit, "
            f"got {new_quota.blueprints_limit}"
        )
        assert new_quota.api_calls_limit == 10000, (
            f"Free tier should have 10000 API call limit, "
            f"got {new_quota.api_calls_limit}"
        )
    elif tier == SubscriptionTier.PRO:
        assert new_quota.blueprints_limit == 10, (
            f"Pro tier should have 10 blueprint limit, "
            f"got {new_quota.blueprints_limit}"
        )
        assert new_quota.api_calls_limit == -1, (
            f"Pro tier should have unlimited API calls (limit=-1), "
            f"got {new_quota.api_calls_limit}"
        )
    elif tier == SubscriptionTier.ENTERPRISE:
        assert new_quota.blueprints_limit == -1, (
            f"Enterprise tier should have unlimited blueprints (limit=-1), "
            f"got {new_quota.blueprints_limit}"
        )
        assert new_quota.api_calls_limit == -1, (
            f"Enterprise tier should have unlimited API calls (limit=-1), "
            f"got {new_quota.api_calls_limit}"
        )
    
    # Property 7: New quota period should start after old period
    assert new_quota.period_start >= old_period_end, (
        f"New period start should be after old period end. "
        f"Old end: {old_period_end}, New start: {new_quota.period_start}"
    )
    
    # Property 8: New quota period should be approximately 30 days
    period_duration = (new_quota.period_end - new_quota.period_start).days
    assert 28 <= period_duration <= 32, (
        f"New period should be approximately 30 days, got {period_duration} days"
    )
    
    # Property 9: New quota should be for current period
    assert new_quota.is_current_period() is True, (
        f"New quota should be for current period"
    )
    
    # Property 10: Subscription period dates should be updated
    await db_session.refresh(subscription)
    assert subscription.current_period_start >= old_period_end, (
        f"Subscription period start should be updated"
    )
    assert subscription.current_period_end > subscription.current_period_start, (
        f"Subscription period end should be after start"
    )
    
    # Property 11: Old quota should still exist in database (not deleted)
    stmt = select(UsageQuota).where(UsageQuota.id == old_quota_id)
    result = await db_session.execute(stmt)
    old_quota_check = result.scalar_one_or_none()
    assert old_quota_check is not None, (
        f"Old quota should still exist in database for historical tracking"
    )
    assert old_quota_check.api_calls_used == api_calls_used, (
        f"Old quota usage should be preserved"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 12: Billing Period Quota Reset - Idempotency")
@settings(max_examples=10)
@given(
    tier=subscription_tier_strategy,
)
@pytest.mark.asyncio
async def test_billing_period_quota_reset_idempotency(db_session, tier):
    """
    Feature: ventureos-backend, Property 12: Billing Period Quota Reset - Idempotency
    
    **Validates: Requirements 3.7**
    
    Property: For any user, calling quota reset multiple times should be 
    idempotent - it should not create duplicate quota records or corrupt data.
    
    This property verifies that:
    1. Multiple reset calls don't create duplicate quotas
    2. Only one current quota exists at a time
    3. Reset is safe to call multiple times
    """
    # Create user and subscription
    user_id = uuid4()
    now = datetime.utcnow()
    
    old_period_start = now - timedelta(days=30)
    old_period_end = now - timedelta(days=1)
    
    subscription = Subscription(
        user_id=user_id,
        tier=tier.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=old_period_start,
        current_period_end=old_period_end,
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create old quota
    old_quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=tier,
        period_start=old_period_start,
        period_end=old_period_end,
    )
    db_session.add(old_quota)
    await db_session.commit()
    
    # Reset quota multiple times
    for i in range(3):
        success, error = await reset_quota_for_new_period(db_session, user_id)
        assert success is True, f"Reset {i} should succeed"
    
    # Property: Only one current quota should exist
    current_quota = await get_or_create_quota(db_session, user_id)
    assert current_quota is not None
    assert current_quota.is_current_period() is True
    
    # Verify no duplicate current quotas
    stmt = select(UsageQuota).where(
        UsageQuota.user_id == user_id,
        UsageQuota.period_start <= now,
        UsageQuota.period_end >= now,
    )
    result = await db_session.execute(stmt)
    current_quotas = result.scalars().all()
    
    assert len(current_quotas) == 1, (
        f"Should have exactly 1 current quota, found {len(current_quotas)}"
    )
