"""
Celery Application Configuration

This module configures the Celery application for background task processing
and scheduled tasks.

Requirements:
- 23.1: Use Celery with Redis backend for background job processing
- 24.1: Use Celery Beat for scheduled task execution
- 24.6: Schedule subscription renewal checks daily
"""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Create Celery app
celery_app = Celery(
    "ventureos_backend",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.quota_tasks",
        "app.tasks.scraping",
        "app.tasks.blueprint",
        "app.tasks.notification",
        "app.tasks.market",
        "app.tasks.export",
        "app.tasks.maintenance",
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour hard limit
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=86400,  # Results expire after 24 hours
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,  # For testing
)

# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Daily quota reset at 00:00 UTC
    "reset-expired-quotas-daily": {
        "task": "app.tasks.quota_tasks.reset_expired_quotas",
        "schedule": crontab(hour=0, minute=0),  # Daily at midnight UTC
        "options": {"expires": 3600},  # Task expires after 1 hour
    },
    # Product scraping at 03:00 UTC
    "scrape-products-daily": {
        "task": "app.tasks.scraping.scrape_all_products",
        "schedule": crontab(hour=3, minute=0),  # Daily at 3 AM UTC
        "options": {"expires": 7200},  # Task expires after 2 hours
    },
    # Market trend updates at 02:00 UTC
    "update-market-trends-daily": {
        "task": "app.tasks.market.update_market_trends",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM UTC
        "options": {"expires": 3600},  # Task expires after 1 hour
    },
    # Notification cleanup weekly
    "cleanup-old-notifications-weekly": {
        "task": "app.tasks.maintenance.cleanup_old_notifications",
        "schedule": crontab(hour=1, minute=0, day_of_week=0),  # Sunday at 1 AM UTC
        "options": {"expires": 3600},  # Task expires after 1 hour
    },
}

# Task routing (optional - for multiple queues)
celery_app.conf.task_routes = {
    "app.tasks.quota_tasks.*": {"queue": "quota"},
    "app.tasks.scraping.*": {"queue": "scraping"},
    "app.tasks.blueprint.*": {"queue": "blueprint"},
    "app.tasks.notification.*": {"queue": "notifications"},
    "app.tasks.market.*": {"queue": "market"},
    "app.tasks.export.*": {"queue": "export"},
    "app.tasks.maintenance.*": {"queue": "maintenance"},
}
