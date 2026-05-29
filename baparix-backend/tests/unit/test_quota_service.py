"""
Unit Tests for Usage Quota Service

This module tests the quota tracking and management functions.

Requirements:
- 3.4: Track API call usage per User per billing period
- 3.5: Track blueprint generation count per User per billing period
- 3.7: Reset usage quotas at the start of each billing period
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import (
    Subscription,
    SubscriptionTier,
    SubscriptionStatus,
    UsageQuota,
)
from app.services.quota_service import (
    get_current_quota,
    get_or_create_quota,
    increment_blueprint_count,
    increment_api_call_count,
    check_blueprint_quota,
    check_api_call_quota,
    reset_quota_for_new_period,
    get_quota_status,
)


@pytest.mark.asyncio
async def test_get_or_create_quota_creates_new(db_session: AsyncSession):
    """Test that get_or_create_quota creates a new quota if none exists."""
    user_id = uuid4()
    
    # Create subscription
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.FREE.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Get or create quota
    quota = await get_or_create_quota(db_session, user_id)
    
    assert quota is not None
    assert quota.user_id == user_id
    assert quota.blueprints_generated == 0
    assert quota.blueprints_limit == 1  # Free tier
    assert quota.api_calls_used == 0
    assert quota.api_calls_limit == 10000  # Free tier


@pytest.mark.asyncio
async def test_get_or_create_quota_returns_existing(db_session: AsyncSession):
    """Test that get_or_create_quota returns existing quota."""
    user_id = uuid4()
    
    # Create subscription
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.PRO.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    # Create quota manually
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.PRO,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.blueprints_generated = 5
    db_session.add(quota)
    await db_session.commit()
    
    # Get or create quota
    retrieved_quota = await get_or_create_quota(db_session, user_id)
    
    assert retrieved_quota is not None
    assert retrieved_quota.id == quota.id
    assert retrieved_quota.blueprints_generated == 5


@pytest.mark.asyncio
async def test_increment_blueprint_count_success(db_session: AsyncSession):
    """Test incrementing blueprint count successfully."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.PRO.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.PRO,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    db_session.add(quota)
    await db_session.commit()
    
    # Increment blueprint count
    success, error = await increment_blueprint_count(db_session, user_id)
    
    assert success is True
    assert error is None
    
    # Verify count incremented
    await db_session.refresh(quota)
    assert quota.blueprints_generated == 1


@pytest.mark.asyncio
async def test_increment_blueprint_count_exceeds_limit(db_session: AsyncSession):
    """Test incrementing blueprint count when limit is exceeded."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.FREE.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.FREE,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.blueprints_generated = 1  # Already at limit
    db_session.add(quota)
    await db_session.commit()
    
    # Try to increment blueprint count
    success, error = await increment_blueprint_count(db_session, user_id)
    
    assert success is False
    assert error is not None
    assert "exceeded" in error.lower()


@pytest.mark.asyncio
async def test_increment_api_call_count_success(db_session: AsyncSession):
    """Test incrementing API call count successfully."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.FREE.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.FREE,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    db_session.add(quota)
    await db_session.commit()
    
    # Increment API call count
    success, error = await increment_api_call_count(db_session, user_id, count=10)
    
    assert success is True
    assert error is None
    
    # Verify count incremented
    await db_session.refresh(quota)
    assert quota.api_calls_used == 10


@pytest.mark.asyncio
async def test_check_blueprint_quota_available(db_session: AsyncSession):
    """Test checking blueprint quota when available."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.PRO.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.PRO,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.blueprints_generated = 5
    db_session.add(quota)
    await db_session.commit()
    
    # Check quota
    has_quota, remaining, error = await check_blueprint_quota(db_session, user_id)
    
    assert has_quota is True
    assert remaining == 5  # 10 - 5
    assert error is None


@pytest.mark.asyncio
async def test_check_blueprint_quota_unlimited(db_session: AsyncSession):
    """Test checking blueprint quota for unlimited tier."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.ENTERPRISE.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.ENTERPRISE,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    db_session.add(quota)
    await db_session.commit()
    
    # Check quota
    has_quota, remaining, error = await check_blueprint_quota(db_session, user_id)
    
    assert has_quota is True
    assert remaining is None  # Unlimited
    assert error is None


@pytest.mark.asyncio
async def test_reset_quota_for_new_period(db_session: AsyncSession):
    """Test resetting quota for a new billing period."""
    user_id = uuid4()
    
    # Create subscription with expired period
    now = datetime.utcnow()
    old_period_start = now - timedelta(days=30)
    old_period_end = now - timedelta(days=1)
    
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.PRO.value,
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
        tier=SubscriptionTier.PRO,
        period_start=old_period_start,
        period_end=old_period_end,
    )
    old_quota.blueprints_generated = 8
    old_quota.api_calls_used = 5000
    db_session.add(old_quota)
    await db_session.commit()
    
    # Reset quota for new period
    success, error = await reset_quota_for_new_period(db_session, user_id)
    
    assert success is True
    assert error is None
    
    # Verify new quota created
    new_quota = await get_current_quota(db_session, user_id)
    assert new_quota is not None
    assert new_quota.id != old_quota.id
    assert new_quota.blueprints_generated == 0
    assert new_quota.api_calls_used == 0
    assert new_quota.period_start >= old_period_end


@pytest.mark.asyncio
async def test_get_quota_status(db_session: AsyncSession):
    """Test getting quota status for a user."""
    user_id = uuid4()
    
    # Create subscription and quota
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=user_id,
        tier=SubscriptionTier.PRO.value,
        status=SubscriptionStatus.ACTIVE.value,
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db_session.add(subscription)
    await db_session.commit()
    
    quota = UsageQuota.create_for_subscription(
        user_id=user_id,
        subscription_id=subscription.id,
        tier=SubscriptionTier.PRO,
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    quota.blueprints_generated = 3
    quota.api_calls_used = 1500
    db_session.add(quota)
    await db_session.commit()
    
    # Get quota status
    status = await get_quota_status(db_session, user_id)
    
    assert status is not None
    assert status["blueprints"]["used"] == 3
    assert status["blueprints"]["limit"] == 10
    assert status["blueprints"]["remaining"] == 7
    assert status["api_calls"]["used"] == 1500
    assert status["api_calls"]["limit"] is None  # Unlimited for Pro
    assert status["api_calls"]["remaining"] is None
    assert "period" in status
