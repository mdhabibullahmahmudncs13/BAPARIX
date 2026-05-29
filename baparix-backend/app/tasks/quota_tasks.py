"""
Usage Quota Celery Tasks

This module defines Celery tasks for managing usage quotas, including
scheduled tasks for daily quota resets.

Requirements:
- 3.7: Reset usage quotas at the start of each billing period
- 24.6: Schedule subscription renewal checks daily
"""

import structlog
from datetime import datetime
from typing import List
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import celery_app
from app.db.postgres import get_db_session
from app.models.subscription import Subscription, SubscriptionStatus, UsageQuota
from app.services.quota_service import reset_quota_for_new_period

logger = structlog.get_logger(__name__)


@celery_app.task(name="app.tasks.quota_tasks.reset_expired_quotas", bind=True)
def reset_expired_quotas(self):
    """
    Scheduled task to reset quotas for users whose billing period has ended.
    
    This task runs daily at 00:00 UTC and checks for subscriptions whose
    current_period_end has passed. For each expired subscription, it creates
    a new quota record for the next billing period.
    
    Returns:
        dict: Task execution summary with counts
    """
    import asyncio
    
    logger.info("reset_expired_quotas_task_started")
    
    try:
        # Run async function in event loop
        result = asyncio.run(_reset_expired_quotas_async())
        
        logger.info(
            "reset_expired_quotas_task_completed",
            **result,
        )
        
        return result
    
    except Exception as e:
        logger.error(
            "reset_expired_quotas_task_error",
            error=str(e),
            exc_info=True,
        )
        raise


async def _reset_expired_quotas_async() -> dict:
    """
    Async implementation of quota reset logic.
    
    Returns:
        dict: Execution summary with counts
    """
    processed = 0
    succeeded = 0
    failed = 0
    errors = []
    
    try:
        async with get_db_session() as db:
            # Find all active subscriptions with expired periods
            now = datetime.utcnow()
            
            stmt = select(Subscription).where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE.value,
                    Subscription.current_period_end <= now,
                )
            )
            
            result = await db.execute(stmt)
            expired_subscriptions = result.scalars().all()
            
            logger.info(
                "found_expired_subscriptions",
                count=len(expired_subscriptions),
            )
            
            # Reset quota for each expired subscription
            for subscription in expired_subscriptions:
                processed += 1
                
                try:
                    success, error = await reset_quota_for_new_period(
                        db=db,
                        user_id=subscription.user_id,
                    )
                    
                    if success:
                        succeeded += 1
                        logger.info(
                            "quota_reset_success",
                            user_id=str(subscription.user_id),
                            subscription_id=str(subscription.id),
                        )
                    else:
                        failed += 1
                        errors.append({
                            "user_id": str(subscription.user_id),
                            "error": error,
                        })
                        logger.warning(
                            "quota_reset_failed",
                            user_id=str(subscription.user_id),
                            error=error,
                        )
                
                except Exception as e:
                    failed += 1
                    error_msg = str(e)
                    errors.append({
                        "user_id": str(subscription.user_id),
                        "error": error_msg,
                    })
                    logger.error(
                        "quota_reset_exception",
                        user_id=str(subscription.user_id),
                        error=error_msg,
                        exc_info=True,
                    )
        
        return {
            "processed": processed,
            "succeeded": succeeded,
            "failed": failed,
            "errors": errors[:10],  # Limit error list to first 10
        }
    
    except Exception as e:
        logger.error(
            "reset_expired_quotas_async_error",
            error=str(e),
            exc_info=True,
        )
        raise


@celery_app.task(name="app.tasks.quota_tasks.reset_quota_for_user", bind=True)
def reset_quota_for_user(self, user_id: str):
    """
    Task to reset quota for a specific user.
    
    This task can be called manually or triggered by subscription changes.
    
    Args:
        user_id: User's unique identifier (as string)
    
    Returns:
        dict: Task execution result
    """
    import asyncio
    
    logger.info(
        "reset_quota_for_user_task_started",
        user_id=user_id,
    )
    
    try:
        # Convert string to UUID
        user_uuid = UUID(user_id)
        
        # Run async function in event loop
        result = asyncio.run(_reset_quota_for_user_async(user_uuid))
        
        logger.info(
            "reset_quota_for_user_task_completed",
            user_id=user_id,
            **result,
        )
        
        return result
    
    except Exception as e:
        logger.error(
            "reset_quota_for_user_task_error",
            user_id=user_id,
            error=str(e),
            exc_info=True,
        )
        raise


async def _reset_quota_for_user_async(user_id: UUID) -> dict:
    """
    Async implementation of user-specific quota reset.
    
    Args:
        user_id: User's unique identifier
    
    Returns:
        dict: Execution result
    """
    try:
        async with get_db_session() as db:
            success, error = await reset_quota_for_new_period(
                db=db,
                user_id=user_id,
            )
            
            if success:
                return {
                    "success": True,
                    "user_id": str(user_id),
                }
            else:
                return {
                    "success": False,
                    "user_id": str(user_id),
                    "error": error,
                }
    
    except Exception as e:
        logger.error(
            "reset_quota_for_user_async_error",
            user_id=str(user_id),
            error=str(e),
            exc_info=True,
        )
        raise


@celery_app.task(name="app.tasks.quota_tasks.check_subscription_renewals", bind=True)
def check_subscription_renewals(self):
    """
    Scheduled task to check for upcoming subscription renewals.
    
    This task runs daily and sends notifications to users whose subscriptions
    are expiring within 7 days.
    
    Returns:
        dict: Task execution summary
    """
    import asyncio
    
    logger.info("check_subscription_renewals_task_started")
    
    try:
        # Run async function in event loop
        result = asyncio.run(_check_subscription_renewals_async())
        
        logger.info(
            "check_subscription_renewals_task_completed",
            **result,
        )
        
        return result
    
    except Exception as e:
        logger.error(
            "check_subscription_renewals_task_error",
            error=str(e),
            exc_info=True,
        )
        raise


async def _check_subscription_renewals_async() -> dict:
    """
    Async implementation of subscription renewal check.
    
    Returns:
        dict: Execution summary
    """
    from datetime import timedelta
    
    processed = 0
    notifications_sent = 0
    
    try:
        async with get_db_session() as db:
            # Find subscriptions expiring in 7 days
            now = datetime.utcnow()
            renewal_threshold = now + timedelta(days=7)
            
            stmt = select(Subscription).where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE.value,
                    Subscription.current_period_end <= renewal_threshold,
                    Subscription.current_period_end > now,
                )
            )
            
            result = await db.execute(stmt)
            expiring_subscriptions = result.scalars().all()
            
            logger.info(
                "found_expiring_subscriptions",
                count=len(expiring_subscriptions),
            )
            
            # Send renewal notifications
            for subscription in expiring_subscriptions:
                processed += 1
                
                try:
                    # TODO: Implement notification sending
                    # For now, just log
                    days_until_renewal = (subscription.current_period_end - now).days
                    
                    logger.info(
                        "subscription_renewal_reminder",
                        user_id=str(subscription.user_id),
                        days_until_renewal=days_until_renewal,
                        tier=subscription.tier,
                    )
                    
                    notifications_sent += 1
                
                except Exception as e:
                    logger.error(
                        "renewal_notification_error",
                        user_id=str(subscription.user_id),
                        error=str(e),
                        exc_info=True,
                    )
        
        return {
            "processed": processed,
            "notifications_sent": notifications_sent,
        }
    
    except Exception as e:
        logger.error(
            "check_subscription_renewals_async_error",
            error=str(e),
            exc_info=True,
        )
        raise
