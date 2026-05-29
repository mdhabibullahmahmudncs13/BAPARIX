"""
Unit Tests for MongoDB Connection Module

Tests the MongoDB connection, health checks, retry logic, and index creation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.db import mongodb


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    with patch("app.db.mongodb.settings") as mock:
        mock.mongodb_url = "mongodb://test:test@localhost:27017/test_db"
        mock.MONGODB_DB = "test_db"
        yield mock


@pytest.fixture(autouse=True)
def reset_globals():
    """Reset global variables before each test."""
    mongodb._client = None
    mongodb._database = None
    yield
    mongodb._client = None
    mongodb._database = None


class TestMongoDBClient:
    """Tests for MongoDB client creation and management."""
    
    def test_get_client_creates_new_client(self, mock_settings):
        """Test that get_client creates a new client on first call."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            
            client = mongodb.get_client()
            
            assert client == mock_client
            mock_client_class.assert_called_once()
            
            # Verify connection pool settings
            call_kwargs = mock_client_class.call_args[1]
            assert call_kwargs["maxPoolSize"] == 20
            assert call_kwargs["minPoolSize"] == 10
            assert call_kwargs["retryWrites"] is True
            assert call_kwargs["retryReads"] is True
    
    def test_get_client_returns_existing_client(self, mock_settings):
        """Test that get_client returns existing client on subsequent calls."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            
            client1 = mongodb.get_client()
            client2 = mongodb.get_client()
            
            assert client1 == client2
            mock_client_class.assert_called_once()
    
    def test_get_database_creates_database(self, mock_settings):
        """Test that get_database creates database instance."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_database = MagicMock()
            mock_client.__getitem__.return_value = mock_database
            mock_client_class.return_value = mock_client
            
            database = mongodb.get_database()
            
            assert database == mock_database
            mock_client.__getitem__.assert_called_once_with("test_db")
    
    def test_get_collection_returns_collection(self, mock_settings):
        """Test that get_collection returns the correct collection."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_database = MagicMock()
            mock_collection = MagicMock()
            mock_client.__getitem__.return_value = mock_database
            mock_database.__getitem__.return_value = mock_collection
            mock_client_class.return_value = mock_client
            
            collection = mongodb.get_collection("test_collection")
            
            assert collection == mock_collection
            mock_database.__getitem__.assert_called_once_with("test_collection")


class TestHealthCheck:
    """Tests for MongoDB health check functionality."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, mock_settings):
        """Test successful health check."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_admin = MagicMock()
            mock_client.admin = mock_admin
            mock_admin.command = AsyncMock(return_value={"ok": 1})
            mock_client_class.return_value = mock_client
            
            is_healthy = await mongodb.check_database_health()
            
            assert is_healthy is True
            mock_admin.command.assert_called_once_with("ping")
    
    @pytest.mark.asyncio
    async def test_health_check_connection_failure(self, mock_settings):
        """Test health check with connection failure."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_admin = MagicMock()
            mock_client.admin = mock_admin
            mock_admin.command = AsyncMock(side_effect=ConnectionFailure("Connection failed"))
            mock_client_class.return_value = mock_client
            
            is_healthy = await mongodb.check_database_health()
            
            assert is_healthy is False
    
    @pytest.mark.asyncio
    async def test_health_check_timeout(self, mock_settings):
        """Test health check with server selection timeout."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_admin = MagicMock()
            mock_client.admin = mock_admin
            mock_admin.command = AsyncMock(
                side_effect=ServerSelectionTimeoutError("Timeout")
            )
            mock_client_class.return_value = mock_client
            
            is_healthy = await mongodb.check_database_health()
            
            assert is_healthy is False


class TestInitialization:
    """Tests for MongoDB initialization with retry logic."""
    
    @pytest.mark.asyncio
    async def test_init_db_success(self, mock_settings):
        """Test successful database initialization."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health", return_value=True), \
             patch("app.db.mongodb.create_indexes") as mock_create_indexes:
            
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            mock_create_indexes.return_value = AsyncMock()
            
            await mongodb.init_db()
            
            mock_create_indexes.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_init_db_retry_logic(self, mock_settings):
        """Test initialization retry logic with eventual success."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health") as mock_health, \
             patch("app.db.mongodb.create_indexes") as mock_create_indexes, \
             patch("asyncio.sleep") as mock_sleep:
            
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            mock_create_indexes.return_value = AsyncMock()
            
            # Fail first two attempts, succeed on third
            mock_health.side_effect = [False, False, True]
            
            await mongodb.init_db()
            
            # Should have retried twice (3 total attempts)
            assert mock_health.call_count == 3
            assert mock_sleep.call_count == 2
            mock_create_indexes.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_init_db_max_retries_exceeded(self, mock_settings):
        """Test initialization failure after max retries."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health", return_value=False), \
             patch("asyncio.sleep"):
            
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            
            with pytest.raises(Exception) as exc_info:
                await mongodb.init_db()
            
            assert "MongoDB initialization failed after 3 retries" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_init_db_connection_failure_retry(self, mock_settings):
        """Test initialization retry on connection failure."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health") as mock_health, \
             patch("app.db.mongodb.create_indexes") as mock_create_indexes, \
             patch("asyncio.sleep") as mock_sleep:
            
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            mock_create_indexes.return_value = AsyncMock()
            
            # Raise ConnectionFailure on first attempt, succeed on second
            mock_health.side_effect = [
                ConnectionFailure("Connection failed"),
                True
            ]
            
            await mongodb.init_db()
            
            assert mock_health.call_count == 2
            assert mock_sleep.call_count == 1
            mock_create_indexes.assert_called_once()


class TestIndexCreation:
    """Tests for MongoDB index creation."""
    
    @pytest.mark.asyncio
    async def test_create_indexes_products(self, mock_settings):
        """Test that product collection indexes are created."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_database = MagicMock()
            mock_products_collection = MagicMock()
            mock_products_collection.create_index = AsyncMock()
            
            mock_client.__getitem__.return_value = mock_database
            mock_database.__getitem__.return_value = mock_products_collection
            mock_client_class.return_value = mock_client
            
            await mongodb.create_indexes()
            
            # Verify indexes were created
            assert mock_products_collection.create_index.call_count >= 5
            
            # Check specific indexes
            calls = [call[0][0] for call in mock_products_collection.create_index.call_args_list]
            assert "category" in calls
            assert "platform" in calls
            assert "price_range.min" in calls
            assert "price_range.max" in calls
    
    @pytest.mark.asyncio
    async def test_create_indexes_market_trends(self, mock_settings):
        """Test that market trends collection indexes are created."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_database = MagicMock()
            
            # Create separate mocks for each collection
            mock_products = MagicMock()
            mock_products.create_index = AsyncMock()
            mock_trends = MagicMock()
            mock_trends.create_index = AsyncMock()
            mock_jobs = MagicMock()
            mock_jobs.create_index = AsyncMock()
            
            def get_collection(name):
                if name == "products":
                    return mock_products
                elif name == "market_trends":
                    return mock_trends
                elif name == "scraping_jobs":
                    return mock_jobs
            
            mock_client.__getitem__.return_value = mock_database
            mock_database.__getitem__.side_effect = get_collection
            mock_client_class.return_value = mock_client
            
            await mongodb.create_indexes()
            
            # Verify market trends indexes
            assert mock_trends.create_index.call_count >= 3
            calls = [call[0][0] for call in mock_trends.create_index.call_args_list]
            assert "product_category" in calls
            assert "geography" in calls
            assert "created_at" in calls


class TestConnectionCleanup:
    """Tests for MongoDB connection cleanup."""
    
    @pytest.mark.asyncio
    async def test_close_db_closes_client(self, mock_settings):
        """Test that close_db properly closes the client."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class:
            mock_client = MagicMock()
            mock_client.close = MagicMock()
            mock_client_class.return_value = mock_client
            
            # Initialize client
            mongodb.get_client()
            
            # Close database
            await mongodb.close_db()
            
            mock_client.close.assert_called_once()
            assert mongodb._client is None
            assert mongodb._database is None
    
    @pytest.mark.asyncio
    async def test_close_db_handles_none_client(self, mock_settings):
        """Test that close_db handles None client gracefully."""
        mongodb._client = None
        
        # Should not raise exception
        await mongodb.close_db()
        
        assert mongodb._client is None


class TestConnectionStats:
    """Tests for MongoDB connection statistics."""
    
    @pytest.mark.asyncio
    async def test_get_connection_stats_success(self, mock_settings):
        """Test getting connection statistics."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health", return_value=True):
            
            mock_client = MagicMock()
            mock_database = MagicMock()
            mock_database.name = "test_db"
            mock_client.__getitem__.return_value = mock_database
            mock_client_class.return_value = mock_client
            
            stats = await mongodb.get_connection_stats()
            
            assert stats["database_name"] == "test_db"
            assert stats["max_pool_size"] == 20
            assert stats["min_pool_size"] == 10
            assert stats["is_connected"] is True
    
    @pytest.mark.asyncio
    async def test_get_connection_stats_disconnected(self, mock_settings):
        """Test getting connection statistics when disconnected."""
        with patch("app.db.mongodb.AsyncIOMotorClient") as mock_client_class, \
             patch("app.db.mongodb.check_database_health", return_value=False):
            
            mock_client = MagicMock()
            mock_database = MagicMock()
            mock_database.name = "test_db"
            mock_client.__getitem__.return_value = mock_database
            mock_client_class.return_value = mock_client
            
            stats = await mongodb.get_connection_stats()
            
            assert stats["database_name"] == "test_db"
            assert stats["is_connected"] is False


class TestCollectionHelpers:
    """Tests for collection helper functions."""
    
    def test_get_products_collection(self, mock_settings):
        """Test getting products collection."""
        with patch("app.db.mongodb.get_collection") as mock_get_collection:
            mock_collection = MagicMock()
            mock_get_collection.return_value = mock_collection
            
            collection = mongodb.get_products_collection()
            
            mock_get_collection.assert_called_once_with("products")
            assert collection == mock_collection
    
    def test_get_market_trends_collection(self, mock_settings):
        """Test getting market trends collection."""
        with patch("app.db.mongodb.get_collection") as mock_get_collection:
            mock_collection = MagicMock()
            mock_get_collection.return_value = mock_collection
            
            collection = mongodb.get_market_trends_collection()
            
            mock_get_collection.assert_called_once_with("market_trends")
            assert collection == mock_collection
    
    def test_get_scraping_jobs_collection(self, mock_settings):
        """Test getting scraping jobs collection."""
        with patch("app.db.mongodb.get_collection") as mock_get_collection:
            mock_collection = MagicMock()
            mock_get_collection.return_value = mock_collection
            
            collection = mongodb.get_scraping_jobs_collection()
            
            mock_get_collection.assert_called_once_with("scraping_jobs")
            assert collection == mock_collection
