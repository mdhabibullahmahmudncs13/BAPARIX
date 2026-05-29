"""
PostgreSQL Database Connection Module

This module provides async PostgreSQL connection pooling using asyncpg and SQLAlchemy.
It implements connection management with health checks and proper resource cleanup.

Requirements:
- 30.1: Use Alembic for PostgreSQL schema migrations
- 30.3: Enforce foreign key constraints for relational data
- 30.5: Index frequently queried fields
- 36.5: Implement connection pooling for database connections
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy Base for models
Base = declarative_base()

# Global engine and session maker
_engine: Optional[AsyncEngine] = None
_async_session_maker: Optional[async_sessionmaker] = None


def get_engine() -> AsyncEngine:
    """
    Get or create the global async database engine.
    
    Connection pool configuration:
    - min_size: 10 connections (minimum pool size)
    - max_size: 20 connections (maximum pool size)
    - max_overflow: 10 (additional connections beyond max_size)
    - pool_timeout: 30 seconds (wait time for connection)
    - pool_recycle: 3600 seconds (recycle connections after 1 hour)
    - pool_pre_ping: True (verify connections before use)
    
    Returns:
        AsyncEngine: SQLAlchemy async engine instance
    """
    global _engine
    
    if _engine is None:
        logger.info("Creating PostgreSQL async engine with connection pool")
        
        # Create async engine with connection pooling
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.DEBUG,  # Log SQL queries in debug mode
            pool_size=10,  # Minimum number of connections in pool
            max_overflow=10,  # Additional connections beyond pool_size
            pool_timeout=30,  # Seconds to wait for connection
            pool_recycle=3600,  # Recycle connections after 1 hour
            pool_pre_ping=True,  # Verify connection health before use
            connect_args={
                "server_settings": {
                    "application_name": "ventureos_backend",
                    "jit": "off",  # Disable JIT for better connection pool performance
                },
                "command_timeout": 60,  # Query timeout in seconds
                "timeout": 10,  # Connection timeout in seconds
            },
        )
        
        logger.info(
            f"PostgreSQL engine created: pool_size=10, max_overflow=10, "
            f"total_max_connections=20"
        )
    
    return _engine


def get_session_maker() -> async_sessionmaker:
    """
    Get or create the global async session maker.
    
    Returns:
        async_sessionmaker: SQLAlchemy async session maker
    """
    global _async_session_maker
    
    if _async_session_maker is None:
        engine = get_engine()
        _async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,  # Don't expire objects after commit
            autocommit=False,
            autoflush=False,
        )
        logger.info("PostgreSQL async session maker created")
    
    return _async_session_maker


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions.
    
    Usage:
        async with get_db_session() as session:
            result = await session.execute(query)
            await session.commit()
    
    Yields:
        AsyncSession: SQLAlchemy async session
    """
    session_maker = get_session_maker()
    session = session_maker()
    
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Database session error: {e}", exc_info=True)
        raise
    finally:
        await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function for FastAPI endpoints.
    
    Usage in FastAPI:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    
    Yields:
        AsyncSession: SQLAlchemy async session
    """
    async with get_db_session() as session:
        yield session


async def check_database_health() -> bool:
    """
    Perform a health check query to verify database connectivity.
    
    This function executes a simple SELECT 1 query to verify that:
    - Database connection is established
    - Connection pool is functioning
    - Database server is responsive
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        async with get_db_session() as session:
            result = await session.execute(text("SELECT 1"))
            value = result.scalar()
            
            if value == 1:
                logger.debug("Database health check passed")
                return True
            else:
                logger.warning(f"Database health check returned unexpected value: {value}")
                return False
                
    except Exception as e:
        logger.error(f"Database health check failed: {e}", exc_info=True)
        return False


async def init_db() -> None:
    """
    Initialize database connection pool.
    
    This function should be called during application startup to:
    - Create the async engine
    - Initialize the connection pool
    - Verify database connectivity
    
    Raises:
        Exception: If database initialization fails
    """
    try:
        logger.info("Initializing PostgreSQL database connection pool")
        
        # Create engine and session maker
        engine = get_engine()
        get_session_maker()
        
        # Verify connectivity with health check
        is_healthy = await check_database_health()
        
        if not is_healthy:
            raise Exception("Database health check failed during initialization")
        
        logger.info("PostgreSQL database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL database: {e}", exc_info=True)
        raise


async def close_db() -> None:
    """
    Close database connection pool and cleanup resources.
    
    This function should be called during application shutdown to:
    - Close all active connections
    - Dispose of the connection pool
    - Release database resources
    """
    global _engine, _async_session_maker
    
    try:
        if _engine is not None:
            logger.info("Closing PostgreSQL database connection pool")
            await _engine.dispose()
            _engine = None
            _async_session_maker = None
            logger.info("PostgreSQL database connection pool closed")
    except Exception as e:
        logger.error(f"Error closing PostgreSQL database: {e}", exc_info=True)
        raise


async def get_pool_status() -> dict:
    """
    Get current connection pool status for monitoring.
    
    Returns:
        dict: Connection pool statistics including:
            - pool_size: Current number of connections in pool
            - checked_out: Number of connections currently in use
            - overflow: Number of overflow connections
            - total_connections: Total connections (pool + overflow)
    """
    engine = get_engine()
    pool = engine.pool
    
    return {
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow(),
        "max_pool_size": 10,
        "max_overflow": 10,
        "max_total_connections": 20,
    }
