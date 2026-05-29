"""
Database Module

This module provides database connection utilities for PostgreSQL, MongoDB, and Redis.
"""

from app.db.postgres import (
    Base,
    check_database_health,
    close_db,
    get_db,
    get_db_session,
    get_engine,
    get_pool_status,
    get_session_maker,
    init_db,
)

# MongoDB and Redis are imported separately in their respective modules
# from app.db.mongodb import ...
# from app.db.redis import ...

__all__ = [
    "Base",
    "get_engine",
    "get_session_maker",
    "get_db_session",
    "get_db",
    "check_database_health",
    "init_db",
    "close_db",
    "get_pool_status",
]
