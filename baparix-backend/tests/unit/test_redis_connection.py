"""
Unit Tests for Redis Connection Module

Tests the Redis connection pool, health checks, and cache helper functions.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from redis.exceptions import ConnectionError, TimeoutError, RedisError

from app.db import redis as redis_module


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    with patch("app.db.redis.settings") as mock:
        mock.redis_url = "redis://:test@localhost:6379/0"
        yield mock


@pytest.fixture(autouse=True)
def reset_globals():
    """Reset global variables before each test."""
    redis_module._client = None
    redis_module._pool = None
    yield
    redis_module._client = None
    redis_module._pool = None


class TestRedisConnectionPool:
    """Tests for Redis connection pool creation and management."""
    
    def test_get_connection_pool_creates_new_pool(self, mock_settings):
        """Test that get_connection_pool creates a new pool on first call."""
        with patch("app.db.redis.ConnectionPool") as mock_pool_class:
            mock_pool = MagicMock()
            mock_pool_class.from_url.return_value = mock_pool
            
            pool = redis_module.get_connection_pool()
            
            assert pool == mock_pool
            mock_pool_class.from_url.assert_called_once()
            
            # Verify connection pool settings
            call_kwargs = mock_pool_class.from_url.call_args[1]
            assert call_kwargs["max_connections"] == 20
            assert call_kwargs["socket_timeout"] == 5
            assert call_kwargs["socket_connect_timeout"] == 5
            assert call_kwargs["socket_keepalive"] is True
            assert call_kwargs["health_check_interval"] == 30
            assert call_kwargs["retry_on_timeout"] is True
            assert call_kwargs["decode_responses"] is False
    
    def test_get_connection_pool_returns_existing_pool(self, mock_settings):
        """Test that get_connection_pool returns existing pool on subsequent calls."""
        with patch("app.db.redis.ConnectionPool") as mock_pool_class:
            mock_pool = MagicMock()
            mock_pool_class.from_url.return_value = mock_pool
            
            pool1 = redis_module.get_connection_pool()
            pool2 = redis_module.get_connection_pool()
            
            assert pool1 == pool2
            mock_pool_class.from_url.assert_called_once()
    
    def test_get_client_creates_new_client(self, mock_settings):
        """Test that get_client creates a new client on first call."""
        with patch("app.db.redis.ConnectionPool") as mock_pool_class, \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_pool = MagicMock()
            mock_pool_class.from_url.return_value = mock_pool
            mock_client = MagicMock()
            mock_redis_class.return_value = mock_client
            
            client = redis_module.get_client()
            
            assert client == mock_client
            mock_redis_class.assert_called_once_with(connection_pool=mock_pool)
    
    def test_get_client_returns_existing_client(self, mock_settings):
        """Test that get_client returns existing client on subsequent calls."""
        with patch("app.db.redis.ConnectionPool") as mock_pool_class, \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_pool = MagicMock()
            mock_pool_class.from_url.return_value = mock_pool
            mock_client = MagicMock()
            mock_redis_class.return_value = mock_client
            
            client1 = redis_module.get_client()
            client2 = redis_module.get_client()
            
            assert client1 == client2
            mock_redis_class.assert_called_once()


class TestHealthCheck:
    """Tests for Redis health check functionality."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, mock_settings):
        """Test successful health check."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ping = AsyncMock(return_value=True)
            mock_redis_class.return_value = mock_client
            
            is_healthy = await redis_module.check_redis_health()
            
            assert is_healthy is True
            mock_client.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_health_check_connection_error(self, mock_settings):
        """Test health check with connection error."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ping = AsyncMock(side_effect=ConnectionError("Connection failed"))
            mock_redis_class.return_value = mock_client
            
            is_healthy = await redis_module.check_redis_health()
            
            assert is_healthy is False
    
    @pytest.mark.asyncio
    async def test_health_check_timeout(self, mock_settings):
        """Test health check with timeout error."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ping = AsyncMock(side_effect=TimeoutError("Timeout"))
            mock_redis_class.return_value = mock_client
            
            is_healthy = await redis_module.check_redis_health()
            
            assert is_healthy is False
    
    @pytest.mark.asyncio
    async def test_health_check_redis_error(self, mock_settings):
        """Test health check with generic Redis error."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ping = AsyncMock(side_effect=RedisError("Redis error"))
            mock_redis_class.return_value = mock_client
            
            is_healthy = await redis_module.check_redis_health()
            
            assert is_healthy is False


class TestInitialization:
    """Tests for Redis initialization."""
    
    @pytest.mark.asyncio
    async def test_init_redis_success(self, mock_settings):
        """Test successful Redis initialization."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class, \
             patch("app.db.redis.check_redis_health", return_value=True):
            
            mock_client = MagicMock()
            mock_redis_class.return_value = mock_client
            
            await redis_module.init_redis()
            
            # Should not raise exception
    
    @pytest.mark.asyncio
    async def test_init_redis_health_check_failure(self, mock_settings):
        """Test Redis initialization with health check failure."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis"), \
             patch("app.db.redis.check_redis_health", return_value=False):
            
            with pytest.raises(Exception) as exc_info:
                await redis_module.init_redis()
            
            assert "Redis health check failed during initialization" in str(exc_info.value)


class TestConnectionCleanup:
    """Tests for Redis connection cleanup."""
    
    @pytest.mark.asyncio
    async def test_close_redis_closes_client_and_pool(self, mock_settings):
        """Test that close_redis properly closes client and pool."""
        with patch("app.db.redis.ConnectionPool") as mock_pool_class, \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_pool = MagicMock()
            mock_pool.disconnect = AsyncMock()
            mock_pool_class.from_url.return_value = mock_pool
            
            mock_client = MagicMock()
            mock_client.close = AsyncMock()
            mock_redis_class.return_value = mock_client
            
            # Initialize client and pool
            redis_module.get_client()
            
            # Close Redis
            await redis_module.close_redis()
            
            mock_client.close.assert_called_once()
            mock_pool.disconnect.assert_called_once()
            assert redis_module._client is None
            assert redis_module._pool is None
    
    @pytest.mark.asyncio
    async def test_close_redis_handles_none_client(self, mock_settings):
        """Test that close_redis handles None client gracefully."""
        redis_module._client = None
        redis_module._pool = None
        
        # Should not raise exception
        await redis_module.close_redis()
        
        assert redis_module._client is None
        assert redis_module._pool is None


class TestPoolInfo:
    """Tests for Redis connection pool information."""
    
    @pytest.mark.asyncio
    async def test_get_pool_info_success(self, mock_settings):
        """Test getting pool information."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis"), \
             patch("app.db.redis.check_redis_health", return_value=True):
            
            info = await redis_module.get_pool_info()
            
            assert info["max_connections"] == 20
            assert info["is_connected"] is True
            assert info["socket_timeout"] == 5
            assert info["socket_connect_timeout"] == 5
            assert info["health_check_interval"] == 30
            assert info["retry_on_timeout"] is True
    
    @pytest.mark.asyncio
    async def test_get_pool_info_disconnected(self, mock_settings):
        """Test getting pool information when disconnected."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis"), \
             patch("app.db.redis.check_redis_health", return_value=False):
            
            info = await redis_module.get_pool_info()
            
            assert info["max_connections"] == 20
            assert info["is_connected"] is False


class TestCacheGet:
    """Tests for cache_get function."""
    
    @pytest.mark.asyncio
    async def test_cache_get_success(self, mock_settings):
        """Test successful cache get."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            test_data = {"key": "value", "number": 42}
            mock_client.get = AsyncMock(return_value=json.dumps(test_data).encode())
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get("test:key")
            
            assert result == test_data
            mock_client.get.assert_called_once_with("test:key")
    
    @pytest.mark.asyncio
    async def test_cache_get_miss(self, mock_settings):
        """Test cache get with cache miss."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=None)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get("test:key")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_get_invalid_json(self, mock_settings):
        """Test cache get with invalid JSON data."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=b"invalid json")
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get("test:key")
            
            assert result is None


class TestCacheSet:
    """Tests for cache_set function."""
    
    @pytest.mark.asyncio
    async def test_cache_set_success(self, mock_settings):
        """Test successful cache set."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.setex = AsyncMock()
            mock_redis_class.return_value = mock_client
            
            test_data = {"key": "value", "number": 42}
            result = await redis_module.cache_set("test:key", test_data, ttl=3600)
            
            assert result is True
            mock_client.setex.assert_called_once()
            call_args = mock_client.setex.call_args[0]
            assert call_args[0] == "test:key"
            assert call_args[1] == 3600
            assert json.loads(call_args[2]) == test_data
    
    @pytest.mark.asyncio
    async def test_cache_set_default_ttl(self, mock_settings):
        """Test cache set with default TTL."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.setex = AsyncMock()
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_set("test:key", {"data": "value"})
            
            assert result is True
            call_args = mock_client.setex.call_args[0]
            assert call_args[1] == redis_module.CACHE_TTL_DEFAULT
    
    @pytest.mark.asyncio
    async def test_cache_set_non_serializable(self, mock_settings):
        """Test cache set with non-serializable data."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_redis_class.return_value = mock_client
            
            # Try to cache a non-serializable object
            class NonSerializable:
                pass
            
            result = await redis_module.cache_set("test:key", NonSerializable())
            
            assert result is False


class TestCacheDelete:
    """Tests for cache_delete function."""
    
    @pytest.mark.asyncio
    async def test_cache_delete_success(self, mock_settings):
        """Test successful cache delete."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=1)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_delete("test:key")
            
            assert result is True
            mock_client.delete.assert_called_once_with("test:key")
    
    @pytest.mark.asyncio
    async def test_cache_delete_key_not_found(self, mock_settings):
        """Test cache delete when key doesn't exist."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=0)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_delete("test:key")
            
            assert result is False


class TestCacheInvalidatePattern:
    """Tests for cache_invalidate_pattern function."""
    
    @pytest.mark.asyncio
    async def test_cache_invalidate_pattern_success(self, mock_settings):
        """Test successful pattern invalidation."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            
            # Mock scan_iter to return keys
            async def mock_scan_iter(match):
                for key in [b"product:1", b"product:2", b"product:3"]:
                    yield key
            
            mock_client.scan_iter = mock_scan_iter
            mock_client.delete = AsyncMock(return_value=3)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_invalidate_pattern("product:*")
            
            assert result == 3
    
    @pytest.mark.asyncio
    async def test_cache_invalidate_pattern_no_matches(self, mock_settings):
        """Test pattern invalidation with no matching keys."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            
            # Mock scan_iter to return no keys
            async def mock_scan_iter(match):
                return
                yield  # Make it a generator
            
            mock_client.scan_iter = mock_scan_iter
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_invalidate_pattern("product:*")
            
            assert result == 0


class TestCacheExists:
    """Tests for cache_exists function."""
    
    @pytest.mark.asyncio
    async def test_cache_exists_true(self, mock_settings):
        """Test cache exists returns True when key exists."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.exists = AsyncMock(return_value=1)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_exists("test:key")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_cache_exists_false(self, mock_settings):
        """Test cache exists returns False when key doesn't exist."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.exists = AsyncMock(return_value=0)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_exists("test:key")
            
            assert result is False


class TestCacheGetTTL:
    """Tests for cache_get_ttl function."""
    
    @pytest.mark.asyncio
    async def test_cache_get_ttl_success(self, mock_settings):
        """Test getting TTL for existing key."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ttl = AsyncMock(return_value=3600)
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get_ttl("test:key")
            
            assert result == 3600
    
    @pytest.mark.asyncio
    async def test_cache_get_ttl_key_not_exists(self, mock_settings):
        """Test getting TTL for non-existent key."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ttl = AsyncMock(return_value=-2)  # Key doesn't exist
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get_ttl("test:key")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_get_ttl_no_expiry(self, mock_settings):
        """Test getting TTL for key with no expiry."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_client.ttl = AsyncMock(return_value=-1)  # No TTL
            mock_redis_class.return_value = mock_client
            
            result = await redis_module.cache_get_ttl("test:key")
            
            assert result is None


class TestCacheMultiple:
    """Tests for cache_set_multiple and cache_get_multiple functions."""
    
    @pytest.mark.asyncio
    async def test_cache_set_multiple_success(self, mock_settings):
        """Test setting multiple cache values."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            mock_pipeline = MagicMock()
            mock_pipeline.setex = MagicMock()
            mock_pipeline.execute = AsyncMock()
            mock_pipeline.__aenter__ = AsyncMock(return_value=mock_pipeline)
            mock_pipeline.__aexit__ = AsyncMock()
            mock_client.pipeline = MagicMock(return_value=mock_pipeline)
            mock_redis_class.return_value = mock_client
            
            items = {
                "key1": {"data": "value1"},
                "key2": {"data": "value2"},
            }
            result = await redis_module.cache_set_multiple(items, ttl=3600)
            
            assert result is True
            assert mock_pipeline.setex.call_count == 2
    
    @pytest.mark.asyncio
    async def test_cache_get_multiple_success(self, mock_settings):
        """Test getting multiple cache values."""
        with patch("app.db.redis.ConnectionPool"), \
             patch("app.db.redis.Redis") as mock_redis_class:
            
            mock_client = MagicMock()
            test_data1 = {"data": "value1"}
            test_data2 = {"data": "value2"}
            mock_client.mget = AsyncMock(return_value=[
                json.dumps(test_data1).encode(),
                json.dumps(test_data2).encode(),
                None,  # Missing key
            ])
            mock_redis_class.return_value = mock_client
            
            keys = ["key1", "key2", "key3"]
            result = await redis_module.cache_get_multiple(keys)
            
            assert len(result) == 2
            assert result["key1"] == test_data1
            assert result["key2"] == test_data2
            assert "key3" not in result


class TestConvenienceFunctions:
    """Tests for convenience cache functions."""
    
    @pytest.mark.asyncio
    async def test_cache_product_search(self, mock_settings):
        """Test caching product search results."""
        with patch("app.db.redis.cache_set") as mock_cache_set:
            mock_cache_set.return_value = True
            
            query = "wireless earbuds"
            filters = {"platform": "alibaba", "min_price": 100}
            results = {"products": []}
            
            result = await redis_module.cache_product_search(query, filters, results)
            
            assert result is True
            mock_cache_set.assert_called_once()
            call_args = mock_cache_set.call_args[0]
            assert "product:search:" in call_args[0]
            assert call_args[1] == results
            assert mock_cache_set.call_args[1]["ttl"] == redis_module.CACHE_TTL_PRODUCT_SEARCH
    
    @pytest.mark.asyncio
    async def test_cache_market_trends(self, mock_settings):
        """Test caching market trend data."""
        with patch("app.db.redis.cache_set") as mock_cache_set:
            mock_cache_set.return_value = True
            
            category = "electronics"
            geography = "Bangladesh"
            trends = {"trends": []}
            
            result = await redis_module.cache_market_trends(category, geography, trends)
            
            assert result is True
            mock_cache_set.assert_called_once()
            call_args = mock_cache_set.call_args[0]
            assert call_args[0] == f"market:trends:{category}:{geography}"
            assert call_args[1] == trends
            assert mock_cache_set.call_args[1]["ttl"] == redis_module.CACHE_TTL_MARKET_TRENDS
    
    @pytest.mark.asyncio
    async def test_cache_shipping_calculation(self, mock_settings):
        """Test caching shipping calculation results."""
        with patch("app.db.redis.cache_set") as mock_cache_set:
            mock_cache_set.return_value = True
            
            params = {"weight": 5, "destination": "Dhaka"}
            calculation = {"cost": 500}
            
            result = await redis_module.cache_shipping_calculation(params, calculation)
            
            assert result is True
            mock_cache_set.assert_called_once()
            call_args = mock_cache_set.call_args[0]
            assert "shipping:calc:" in call_args[0]
            assert call_args[1] == calculation
            assert mock_cache_set.call_args[1]["ttl"] == redis_module.CACHE_TTL_SHIPPING_CALC
    
    @pytest.mark.asyncio
    async def test_cache_ai_response(self, mock_settings):
        """Test caching AI response."""
        with patch("app.db.redis.cache_set") as mock_cache_set:
            mock_cache_set.return_value = True
            
            prompt_hash = "abc123"
            response = {"text": "AI response"}
            
            result = await redis_module.cache_ai_response(prompt_hash, response)
            
            assert result is True
            mock_cache_set.assert_called_once()
            call_args = mock_cache_set.call_args[0]
            assert call_args[0] == f"ai:response:{prompt_hash}"
            assert call_args[1] == response
            assert mock_cache_set.call_args[1]["ttl"] == redis_module.CACHE_TTL_AI_RESPONSE
