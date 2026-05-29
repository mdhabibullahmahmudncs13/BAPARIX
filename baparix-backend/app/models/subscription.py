"""
Subscription and Usage Quota Models

This module defines the Subscription and UsageQuota models for managing
user subscriptions and tracking usage quotas per billing period.

Requirements:
- 3.4: Track API call usage per User per billing period
- 3.5: Track blueprint generation count per User per billing period
- 3.7: Reset usage quotas at the start of each billing period
- 20.1: Maintain subscription records for Free, Pro, and Enterprise tiers
- 20.2: Track subscription status as active, cancelled, or expired
- 20.3: Track current billing period start and end dates
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.postgres import Base


class SubscriptionTier(str, Enum):
    """
    Subscription tier enum defining available subscription levels.
    
    Tiers:
    - FREE: Free tier with limited usage (20 searches/day, 1 blueprint/month)
    - PRO: Pro tier with unlimited searches and 10 blueprints/month
    - ENTERPRISE: Enterprise tier with unlimited everything
    """
    
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """
    Subscription status enum defining subscription states.
    
    Statuses:
    - ACTIVE: Subscription is active and user has access
    - CANCELLED: Subscription is cancelled but still active until period end
    - EXPIRED: Subscription has expired and user has no access
    """
    
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Subscription(Base):
    """
    SQLAlchemy model for user subscriptions.
    
    This model tracks user subscription information including tier, status,
    and billing period dates. It supports the subscription management features
    where users can upgrade, downgrade, or cancel their subscriptions.
    
    Attributes:
        id: Unique identifier for the subscription
        user_id: Reference to the user
        tier: Subscription tier (free, pro, enterprise)
        status: Subscription status (active, cancelled, expired)
        current_period_start: Start date of current billing period
        current_period_end: End date of current billing period
        cancel_at_period_end: Whether subscription will cancel at period end
        cancelled_at: Timestamp when subscription was cancelled
        created_at: Timestamp when subscription was created
        updated_at: Timestamp when subscription was last updated
    """
    
    __tablename__ = "subscriptions"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True, unique=True)
    tier = Column(String(20), nullable=False, default=SubscriptionTier.FREE.value)
    status = Column(String(20), nullable=False, default=SubscriptionStatus.ACTIVE.value, index=True)
    current_period_start = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    current_period_end = Column(TIMESTAMP(timezone=True), nullable=False)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    cancelled_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationship to usage quota
    usage_quotas = relationship("UsageQuota", back_populates="subscription", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Subscription(id={self.id}, user_id={self.user_id}, tier={self.tier}, status={self.status})>"
    
    def is_active(self) -> bool:
        """
        Check if subscription is currently active.
        
        Returns:
            bool: True if subscription is active, False otherwise
        """
        return self.status == SubscriptionStatus.ACTIVE.value
    
    def is_expired(self) -> bool:
        """
        Check if subscription has expired.
        
        Returns:
            bool: True if subscription is expired, False otherwise
        """
        now = datetime.utcnow()
        return now > self.current_period_end or self.status == SubscriptionStatus.EXPIRED.value
    
    def days_until_renewal(self) -> int:
        """
        Calculate days until subscription renewal.
        
        Returns:
            int: Number of days until renewal (negative if expired)
        """
        now = datetime.utcnow()
        delta = self.current_period_end - now
        return delta.days
    
    @classmethod
    def create_free_subscription(cls, user_id: UUID) -> "Subscription":
        """
        Create a new free tier subscription for a user.
        
        Args:
            user_id: The user ID
        
        Returns:
            Subscription: New subscription instance with free tier
        """
        now = datetime.utcnow()
        period_end = now + timedelta(days=30)  # 30-day billing period
        
        return cls(
            user_id=user_id,
            tier=SubscriptionTier.FREE.value,
            status=SubscriptionStatus.ACTIVE.value,
            current_period_start=now,
            current_period_end=period_end,
        )


class UsageQuota(Base):
    """
    SQLAlchemy model for tracking usage quotas per billing period.
    
    This model tracks API call usage and blueprint generation counts per user
    per billing period. It supports the rate limiting and quota management
    features where usage is tracked and enforced based on subscription tier.
    
    Attributes:
        id: Unique identifier for the usage quota
        user_id: Reference to the user
        subscription_id: Reference to the subscription
        period_start: Start date of the billing period
        period_end: End date of the billing period
        blueprints_generated: Number of blueprints generated in this period
        blueprints_limit: Maximum blueprints allowed in this period
        api_calls_used: Number of API calls made in this period
        api_calls_limit: Maximum API calls allowed in this period
        created_at: Timestamp when quota was created
        updated_at: Timestamp when quota was last updated
    """
    
    __tablename__ = "usage_quota"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    subscription_id = Column(PGUUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    period_end = Column(TIMESTAMP(timezone=True), nullable=False, index=True)
    blueprints_generated = Column(Integer, default=0, nullable=False)
    blueprints_limit = Column(Integer, nullable=False)
    api_calls_used = Column(Integer, default=0, nullable=False)
    api_calls_limit = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationship to subscription
    subscription = relationship("Subscription", back_populates="usage_quotas")
    
    def __repr__(self) -> str:
        return (
            f"<UsageQuota(id={self.id}, user_id={self.user_id}, "
            f"blueprints={self.blueprints_generated}/{self.blueprints_limit}, "
            f"api_calls={self.api_calls_used}/{self.api_calls_limit})>"
        )
    
    def is_current_period(self) -> bool:
        """
        Check if this quota is for the current billing period.
        
        Returns:
            bool: True if this is the current period, False otherwise
        """
        now = datetime.utcnow()
        return self.period_start <= now <= self.period_end
    
    def has_blueprint_quota(self) -> bool:
        """
        Check if user has remaining blueprint quota.
        
        Returns:
            bool: True if quota available, False otherwise
        """
        # Unlimited quota (None or -1)
        if self.blueprints_limit is None or self.blueprints_limit < 0:
            return True
        
        return self.blueprints_generated < self.blueprints_limit
    
    def has_api_call_quota(self) -> bool:
        """
        Check if user has remaining API call quota.
        
        Returns:
            bool: True if quota available, False otherwise
        """
        # Unlimited quota (None or -1)
        if self.api_calls_limit is None or self.api_calls_limit < 0:
            return True
        
        return self.api_calls_used < self.api_calls_limit
    
    def remaining_blueprints(self) -> Optional[int]:
        """
        Get remaining blueprint quota.
        
        Returns:
            int | None: Remaining quota or None if unlimited
        """
        if self.blueprints_limit is None or self.blueprints_limit < 0:
            return None
        
        return max(0, self.blueprints_limit - self.blueprints_generated)
    
    def remaining_api_calls(self) -> Optional[int]:
        """
        Get remaining API call quota.
        
        Returns:
            int | None: Remaining quota or None if unlimited
        """
        if self.api_calls_limit is None or self.api_calls_limit < 0:
            return None
        
        return max(0, self.api_calls_limit - self.api_calls_used)
    
    def increment_blueprints(self, count: int = 1) -> None:
        """
        Increment blueprint generation count.
        
        Args:
            count: Number of blueprints to add (default: 1)
        """
        self.blueprints_generated += count
    
    def increment_api_calls(self, count: int = 1) -> None:
        """
        Increment API call count.
        
        Args:
            count: Number of API calls to add (default: 1)
        """
        self.api_calls_used += count
    
    def reset_quota(self) -> None:
        """
        Reset usage counters to zero.
        
        This is called when starting a new billing period.
        """
        self.blueprints_generated = 0
        self.api_calls_used = 0
    
    @classmethod
    def create_for_subscription(
        cls,
        user_id: UUID,
        subscription_id: UUID,
        tier: SubscriptionTier,
        period_start: datetime,
        period_end: datetime,
    ) -> "UsageQuota":
        """
        Create a new usage quota for a subscription.
        
        Args:
            user_id: The user ID
            subscription_id: The subscription ID
            tier: The subscription tier
            period_start: Start of billing period
            period_end: End of billing period
        
        Returns:
            UsageQuota: New usage quota instance with appropriate limits
        """
        # Set limits based on tier
        if tier == SubscriptionTier.FREE:
            blueprints_limit = 1
            api_calls_limit = 10000  # Generous limit for free tier
        elif tier == SubscriptionTier.PRO:
            blueprints_limit = 10
            api_calls_limit = -1  # Unlimited
        elif tier == SubscriptionTier.ENTERPRISE:
            blueprints_limit = -1  # Unlimited
            api_calls_limit = -1  # Unlimited
        else:
            # Default to free tier limits
            blueprints_limit = 1
            api_calls_limit = 10000
        
        return cls(
            user_id=user_id,
            subscription_id=subscription_id,
            period_start=period_start,
            period_end=period_end,
            blueprints_generated=0,
            blueprints_limit=blueprints_limit,
            api_calls_used=0,
            api_calls_limit=api_calls_limit,
        )


# Quota limit configurations per tier
QUOTA_LIMITS = {
    SubscriptionTier.FREE: {
        "blueprints_per_month": 1,
        "api_calls_per_month": 10000,
        "product_searches_per_day": 20,
    },
    SubscriptionTier.PRO: {
        "blueprints_per_month": 10,
        "api_calls_per_month": -1,  # Unlimited
        "product_searches_per_day": -1,  # Unlimited
    },
    SubscriptionTier.ENTERPRISE: {
        "blueprints_per_month": -1,  # Unlimited
        "api_calls_per_month": -1,  # Unlimited
        "product_searches_per_day": -1,  # Unlimited
    },
}


def get_quota_limits(tier: SubscriptionTier) -> dict:
    """
    Get quota limits for a subscription tier.
    
    Args:
        tier: The subscription tier
    
    Returns:
        dict: Quota limits for the tier
    """
    return QUOTA_LIMITS.get(tier, QUOTA_LIMITS[SubscriptionTier.FREE])
