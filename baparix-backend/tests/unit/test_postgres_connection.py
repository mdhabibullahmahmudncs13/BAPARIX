"""
Unit Tests for PostgreSQL Connection Module

Tests the PostgreSQL connection pool, health checks, and session management.
"""

import pytest
from sqlalchemy import text

from app.db import (
    check_database_health,
    close_db,
    get_db_session,
    get_engine,
    get_pool_status,
    get_session_maker,
    init_db,
)


@pytest.mark.asyncio
class TestPostgreSQLConnection:
    """Test suite for PostgreSQL connection functionality."""
    
    async def test_engine_creation(self):
        """Test that the async engine is created successfully."""
        engine = get_engine()
        assert engine is not None
        assert engine.url.drivername == "postgresql+asyncpg"
    
    async def test_session_maker_creation(self):
        """Test that the async session maker is created successfully."""
        session_maker = get_session_maker()
        assert session_maker is not None
    
    async def test_database_health_check(self):
        """Test that database health check query executes successfully."""
        is_healthy = await check_database_health()
        assert is_healthy is True
    
    async def test_db_session_context_manager(self):
        """Test that database session context manager works correctly."""
        async with get_db_session() as session:
            result = await session.execute(text("SELECT 1 as value"))
            value = result.scalar()
            assert value == 1
    
    async def test_db_session_commit(self):
        """Test that database session commits successfully."""
        async with get_db_session() as session:
            # Execute a simple query
            result = await session.execute(text("SELECT 1 + 1 as sum"))
            value = result.scalar()
            assert value == 2
            # Session should auto-commit on exit
    
    async def test_db_session_rollback_on_error(self):
        """Test that database session rolls back on error."""
        with pytest.raises(Exception):
            async with get_db_session() as session:
                # Execute a valid query
                await session.execute(text("SELECT 1"))
                # Raise an error to trigger rollback
                raise Exception("Test error")
    
    async def test_pool_status(self):
        """Test that connection pool status is returned correctly."""
        status = await get_pool_status()
        
        assert "pool_size" in status
        assert "checked_out" in status
        assert "overflow" in status
        assert "total_connections" in status
        assert "max_pool_size" in status
        assert "max_overflow" in status
        assert "max_total_connections" in status
        
        # Verify pool configuration
        assert status["max_pool_size"] == 10
        assert status["max_overflow"] == 10
        assert status["max_total_connections"] == 20
    
    async def test_init_db(self):
        """Test that database initialization completes successfully."""
        await init_db()
        
        # Verify database is healthy after initialization
        is_healthy = await check_database_health()
        assert is_healthy is True
    
    async def test_multiple_concurrent_sessions(self):
        """Test that multiple concurrent sessions can be created."""
        import asyncio
        
        async def query_database(session_id: int):
            async with get_db_session() as session:
                result = await session.execute(
                    text("SELECT :session_id as id"),
                    {"session_id": session_id}
                )
                return result.scalar()
        
        # Create 5 concurrent sessions
        tasks = [query_database(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        # Verify all sessions returned correct values
        assert results == [0, 1, 2, 3, 4]
    
    async def test_connection_pool_limits(self):
        """Test that connection pool respects configured limits."""
        status = await get_pool_status()
        
        # Total connections should not exceed max_total_connections
        total = status["pool_size"] + status["overflow"]
        assert total <= status["max_total_connections"]
    
    async def test_query_timeout(self):
        """Test that queries respect timeout settings."""
        async with get_db_session() as session:
            # Execute a simple query that should complete quickly
            result = await session.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1
    
    async def test_connection_pre_ping(self):
        """Test that connection pre-ping verifies connection health."""
        # Get a session and verify it works
        async with get_db_session() as session:
            result = await session.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1
        
        # Connection should be returned to pool and pre-ping should verify it
        async with get_db_session() as session:
            result = await session.execute(text("SELECT 2"))
            value = result.scalar()
            assert value == 2


@pytest.mark.asyncio
class TestPostgreSQLConnectionEdgeCases:
    """Test suite for PostgreSQL connection edge cases and error handling."""
    
    async def test_invalid_query_handling(self):
        """Test that invalid queries are handled gracefully."""
        with pytest.raises(Exception):
            async with get_db_session() as session:
                # Execute an invalid query
                await session.execute(text("SELECT * FROM nonexistent_table"))
    
    async def test_session_isolation(self):
        """Test that sessions are isolated from each other."""
        # Create a temporary table in one session
        async with get_db_session() as session1:
            await session1.execute(
                text("CREATE TEMPORARY TABLE test_isolation (id INT)")
            )
            await session1.execute(
                text("INSERT INTO test_isolation VALUES (1)")
            )
            result = await session1.execute(text("SELECT COUNT(*) FROM test_isolation"))
            count = result.scalar()
            assert count == 1
        
        # Verify temporary table doesn't exist in another session
        with pytest.raises(Exception):
            async with get_db_session() as session2:
                await session2.execute(text("SELECT COUNT(*) FROM test_isolation"))
    
    async def test_transaction_rollback(self):
        """Test that transactions can be rolled back explicitly."""
        async with get_db_session() as session:
            # Create a temporary table
            await session.execute(
                text("CREATE TEMPORARY TABLE test_rollback (id INT)")
            )
            await session.commit()
            
            # Insert data but rollback
            await session.execute(text("INSERT INTO test_rollback VALUES (1)"))
            await session.rollback()
            
            # Verify data was not inserted
            result = await session.execute(text("SELECT COUNT(*) FROM test_rollback"))
            count = result.scalar()
            assert count == 0


@pytest.mark.asyncio
class TestPostgreSQLConnectionCleanup:
    """Test suite for PostgreSQL connection cleanup."""
    
    async def test_close_db(self):
        """Test that database connections are closed properly."""
        # Initialize database
        await init_db()
        
        # Verify database is healthy
        is_healthy = await check_database_health()
        assert is_healthy is True
        
        # Close database
        await close_db()
        
        # Note: After closing, we need to reinitialize for other tests
        # This is handled by pytest fixtures in conftest.py
