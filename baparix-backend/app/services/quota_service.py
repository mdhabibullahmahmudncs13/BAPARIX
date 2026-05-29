"""
Usage Quota Service

This module provides functions for tracking and managing usage quotas
for API calls and blueprint generation per billing period.

Requirements:
- 3.4: Track API call usage per User per billing period
- 3.5: Track blueprint generation count per User per billing period
- 3.6: Return remaining quota in API response headers
- 3.7: Reset usage quotas at the start of each billing period
"""

import structlog
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import (
    Subscription,
    SubscriptionTier,
    SubscriptionStatus,
    UsageQuota,
    get_quota_limits,
)

logger = structlog.get_logger(__name__)


async def get_current_quota(
    db: AsyncSession,
    user_id: UUID,
) -> Optional[UsageQuota]:
    """
    Get the current usage quota for a user.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        UsageQuota | None: Current usage quota or None if not found
    """
    try:
        now = datetime.utcnow()
        
        # Query for current period quota
        stmt = select(UsageQuota).where(
            and_(
                UsageQuota.user_id == user_id,
                UsageQuota.period_start <= now,
                UsageQuota.period_end >= now,
            )
        )
        
        result = await db.execute(stmt)
        quota = result.scalar_one_or_none()
        
        return quota
    
    except Exception as e:
        logger.error(
            "get_current_quota_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        return None


async def get_or_create_quota(
    db: AsyncSession,
    user_id: UUID,
) -> Optional[UsageQuota]:
    """
    Get or create the current usage quota for a user.
    
    If no quota exists for the current period, creates a new one based on
    the user's subscription tier.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        UsageQuota | None: Current usage quota or None if subscription not found
    """
    try:
        # Check if quota already exists
        quota = await get_current_quota(db, user_id)
        if quota:
            return quota
        
        # Get user's subscription
        stmt = select(Subscription).where(Subscription.user_id == user_id)
        result = await db.execute(stmt)
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            logger.warning(
                "subscription_not_found",
                user_id=str(user_id),
            )
            return None
        
        # Create new quota for current period
        tier = SubscriptionTier(subscription.tier)
        period_start = subscription.current_period_start
        period_end = subscription.current_period_end
        
        quota = UsageQuota.create_for_subscription(
            user_id=user_id,
            subscription_id=subscription.id,
            tier=tier,
            period_start=period_start,
            period_end=period_end,
        )
        
        db.add(quota)
        await db.commit()
        await db.refresh(quota)
        
        logger.info(
            "quota_created",
            user_id=str(user_id),
            quota_id=str(quota.id),
            tier=tier.value,
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
        )
        
        return quota
    
    except Exception as e:
        logger.error(
            "get_or_create_quota_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        await db.rollback()
        return None


async def increment_blueprint_count(
    db: AsyncSession,
    user_id: UUID,
    count: int = 1,
) -> Tuple[bool, Optional[str]]:
    """
    Increment blueprint generation count for a user.
    
    Args:
        db: Database session
        user_id: User's unique identifier
        count: Number of blueprints to add (default: 1)
    
    Returns:
        Tuple[bool, str | None]: (success, error_message)
    """
    try:
        quota = await get_or_create_quota(db, user_id)
        
        if not quota:
            return False, "Quota not found"
        
        # Check if quota available
        if not quota.has_blueprint_quota():
            remaining = quota.remaining_blueprints()
            return False, f"Blueprint quota exceeded. Limit: {quota.blueprints_limit}, Used: {quota.blueprints_generated}"
        
        # Increment count
        quota.increment_blueprints(count)
        await db.commit()
        await db.refresh(quota)
        
        logger.info(
            "blueprint_count_incremented",
            user_id=str(user_id),
            count=count,
            total=quota.blueprints_generated,
            limit=quota.blueprints_limit,
        )
        
        return True, None
    
    except Exception as e:
        logger.error(
            "increment_blueprint_count_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        await db.rollback()
        return False, str(e)


async def increment_api_call_count(
    db: AsyncSession,
    user_id: UUID,
    count: int = 1,
) -> Tuple[bool, Optional[str]]:
    """
    Increment API call count for a user.
    
    Args:
        db: Database session
        user_id: User's unique identifier
        count: Number of API calls to add (default: 1)
    
    Returns:
        Tuple[bool, str | None]: (success, error_message)
    """
    try:
        quota = await get_or_create_quota(db, user_id)
        
        if not quota:
            return False, "Quota not found"
        
        # Check if quota available
        if not quota.has_api_call_quota():
            remaining = quota.remaining_api_calls()
            return False, f"API call quota exceeded. Limit: {quota.api_calls_limit}, Used: {quota.api_calls_used}"
        
        # Increment count
        quota.increment_api_calls(count)
        await db.commit()
        await db.refresh(quota)
        
        logger.debug(
            "api_call_count_incremented",
            user_id=str(user_id),
            count=count,
            total=quota.api_calls_used,
            limit=quota.api_calls_limit,
        )
        
        return True, None
    
    except Exception as e:
        logger.error(
            "increment_api_call_count_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        await db.rollback()
        return False, str(e)


async def check_blueprint_quota(
    db: AsyncSession,
    user_id: UUID,
) -> Tuple[bool, Optional[int], Optional[str]]:
    """
    Check if user has remaining blueprint quota.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        Tuple[bool, int | None, str | None]: (has_quota, remaining, error_message)
    """
    try:
        quota = await get_or_create_quota(db, user_id)
        
        if not quota:
            return False, None, "Quota not found"
        
        has_quota = quota.has_blueprint_quota()
        remaining = quota.remaining_blueprints()
        
        return has_quota, remaining, None
    
    except Exception as e:
        logger.error(
            "check_blueprint_quota_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        return False, None, str(e)


async def check_api_call_quota(
    db: AsyncSession,
    user_id: UUID,
) -> Tuple[bool, Optional[int], Optional[str]]:
    """
    Check if user has remaining API call quota.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        Tuple[bool, int | None, str | None]: (has_quota, remaining, error_message)
    """
    try:
        quota = await get_or_create_quota(db, user_id)
        
        if not quota:
            return False, None, "Quota not found"
        
        has_quota = quota.has_api_call_quota()
        remaining = quota.remaining_api_calls()
        
        return has_quota, remaining, None
    
    except Exception as e:
        logger.error(
            "check_api_call_quota_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        return False, None, str(e)


async def reset_quota_for_new_period(
    db: AsyncSession,
    user_id: UUID,
) -> Tuple[bool, Optional[str]]:
    """
    Reset usage quota for a new billing period.
    
    This function creates a new quota record for the next billing period
    based on the user's current subscription tier.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        Tuple[bool, str | None]: (success, error_message)
    """
    try:
        # Get user's subscription
        stmt = select(Subscription).where(Subscription.user_id == user_id)
        result = await db.execute(stmt)
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            return False, "Subscription not found"
        
        # Calculate new period dates
        now = datetime.utcnow()
        
        # If subscription hasn't expired yet, use the period_end as new start
        if subscription.current_period_end > now:
            period_start = subscription.current_period_end
        else:
            period_start = now
        
        # Calculate period end (30 days from start)
        period_end = period_start + timedelta(days=30)
        
        # Update subscription period
        subscription.current_period_start = period_start
        subscription.current_period_end = period_end
        
        # Create new quota for the new period
        tier = SubscriptionTier(subscription.tier)
        quota = UsageQuota.create_for_subscription(
            user_id=user_id,
            subscription_id=subscription.id,
            tier=tier,
            period_start=period_start,
            period_end=period_end,
        )
        
        db.add(quota)
        await db.commit()
        await db.refresh(quota)
        
        logger.info(
            "quota_reset_for_new_period",
            user_id=str(user_id),
            quota_id=str(quota.id),
            tier=tier.value,
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
        )
        
        return True, None
    
    except Exception as e:
        logger.error(
            "reset_quota_for_new_period_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        await db.rollback()
        return False, str(e)


async def get_quota_status(
    db: AsyncSession,
    user_id: UUID,
) -> Optional[dict]:
    """
    Get current quota status for a user.
    
    Args:
        db: Database session
        user_id: User's unique identifier
    
    Returns:
        dict | None: Quota status information or None if not found
    """
    try:
        quota = await get_or_create_quota(db, user_id)
        
        if not quota:
            return None
        
        return {
            "blueprints": {
                "used": quota.blueprints_generated,
                "limit": quota.blueprints_limit if quota.blueprints_limit >= 0 else None,
                "remaining": quota.remaining_blueprints(),
            },
            "api_calls": {
                "used": quota.api_calls_used,
                "limit": quota.api_calls_limit if quota.api_calls_limit >= 0 else None,
                "remaining": quota.remaining_api_calls(),
            },
            "period": {
                "start": quota.period_start.isoformat(),
                "end": quota.period_end.isoformat(),
            },
        }
    
    except Exception as e:
        logger.error(
            "get_quota_status_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        return None
