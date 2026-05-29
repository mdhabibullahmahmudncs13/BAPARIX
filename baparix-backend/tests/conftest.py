"""
Pytest Configuration and Fixtures

This module provides shared fixtures for testing.
"""

import asyncio

import pytest
from fastapi.testclient import TestClient
from hypothesis import HealthCheck, settings

from app.db import close_db, init_db
from app.main import app


@pytest.fixture
def client():
    """
    Create a test client for the FastAPI application.
    
    Returns:
        TestClient: FastAPI test client
    """
    return TestClient(app)


@pytest.fixture(scope="session")
def session_client():
    """
    Create a session-scoped test client for property-based tests.
    
    This fixture is reused across all test examples in a property test,
    which is appropriate for stateless endpoints like health checks.
    
    Returns:
        TestClient: FastAPI test client
    """
    return TestClient(app)


@pytest.fixture
def mock_settings(monkeypatch):
    """
    Mock application settings for testing.
    
    Args:
        monkeypatch: Pytest monkeypatch fixture
    """
    # Override settings for testing
    monkeypatch.setenv("ENVIRONMENT", "testing")
    monkeypatch.setenv("DEBUG", "True")
    monkeypatch.setenv("CELERY_TASK_ALWAYS_EAGER", "True")


@pytest.fixture(scope="session")
def event_loop():
    """
    Create an event loop for the test session.
    
    This fixture ensures that all async tests share the same event loop,
    which is necessary for database connection pooling to work correctly.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """
    Initialize and cleanup database for testing.
    
    This fixture runs once per test session and ensures:
    - Database connection pool is initialized before tests (if available)
    - Database connection pool is closed after tests
    
    Note: Database initialization is optional. If database is not available,
    tests that don't require database will still run.
    """
    # Try to initialize database, but don't fail if it's not available
    try:
        await init_db()
        db_initialized = True
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Tests that don't require database will still run.")
        db_initialized = False
    
    yield
    
    # Cleanup database if it was initialized
    if db_initialized:
        try:
            await close_db()
        except Exception as e:
            print(f"Warning: Database cleanup failed: {e}")


@pytest.fixture
async def db_session():
    """
    Create a database session for testing.
    
    This fixture provides an async database session for tests that need
    to interact with the database.
    
    Yields:
        AsyncSession: SQLAlchemy async session
    """
    from app.db.postgres import get_db_session
    
    # get_db_session() returns an async context manager
    async with get_db_session() as session:
        yield session


# Configure Hypothesis to suppress function-scoped fixture warnings for stateless tests
settings.register_profile(
    "default",
    suppress_health_check=[HealthCheck.function_scoped_fixture]
)
