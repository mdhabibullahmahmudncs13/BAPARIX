"""
Redis Connection Module

This module provides async Redis connection management using redis-py with asyncio support.
It implements connection pooling, health checks, and cache helper functions for API response
caching and Celery backend support.

Requirements:
- 31.1: Cache product search results in Cache_Layer for 1 hour
- 31.2: Cache market trend data in Cache_Layer for 6 hours
- 31.3: Cache shipping rate calculations in Cache_Layer for 24 hours
- 31.4: Cache Cloud_AI_Model responses for identical requests for 24 hours
"""

import json
import logging
from typing import Any, Optional, Union
from datetime import timedelta

import redis.asyncio as redis
from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import (
    ConnectionError,
    TimeoutError,
    RedisError,
)

from app.config import settings

logger = logging.getLogger(__name__)

# Global Redis client and connection pool
_client: Optional[Redis] = None
_pool: Optional[ConnectionPool] = None

# Cache TTL constants (in seconds)
CACHE_TTL_PRODUCT_SEARCH = 3600  # 1 hour
CACHE_TTL_MARKET_TRENDS = 21600  # 6 hours
CACHE_TTL_SHIPPING_CALC = 86400  # 24 hours
CACHE_TTL_AI_RESPONSE = 86400  # 24 hours
CACHE_TTL_DEFAULT = 3600  # 1 hour default


def get_connection_pool() -> ConnectionPool:
    """
    Get or create the global Redis connection pool.
    
    Connection pool configuration:
    - max_connections: 20 (maximum pool size)
    - socket_timeout: 5 seconds (socket operation timeout)
    - socket_connect_timeout: 5 seconds (connection timeout)
    - socket_keepalive: True (enable TCP keepalive)
    - health_check_interval: 30 seconds (health check frequency)
    - retry_on_timeout: True (retry on timeout)
    - decode_responses: False (return bytes for binary data support)
    
    Returns:
        ConnectionPool: Redis connection pool instance
    """
    global _pool
    
    if _pool is None:
        logger.info("Creating Redis connection pool")
        
        _pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=20,  # Maximum number of connections in pool
            socket_timeout=5,  # Socket operation timeout in seconds
            socket_connect_timeout=5,  # Connection timeout in seconds
            socket_keepalive=True,  # Enable TCP keepalive
            health_check_interval=30,  # Health check every 30 seconds
            retry_on_timeout=True,  # Retry operations on timeout
            decode_responses=False,  # Return bytes for binary data support
        )
        
        logger.info(
            f"Redis connection pool created: max_connections=20, "
            f"socket_timeout=5s, health_check_interval=30s"
        )
    
    return _pool


def get_client() -> Redis:
    """
    Get or create the global async Redis client.
    
    Returns:
        Redis: Redis async client instance
    """
    global _client
    
    if _client is None:
        logger.info("Creating Redis async client")
        pool = get_connection_pool()
        _client = Redis(connection_pool=pool)
        logger.info("Redis async client created")
    
    return _client


async def check_redis_health() -> bool:
    """
    Perform a health check to verify Redis connectivity.
    
    This function executes a simple PING command to verify that:
    - Redis connection is established
    - Connection pool is functioning
    - Redis server is responsive
    
    Returns:
        bool: True if Redis is healthy, False otherwise
    """
    try:
        client = get_client()
        response = await client.ping()
        
        if response:
            logger.debug("Redis health check passed")
            return True
        else:
            logger.warning("Redis health check returned unexpected response")
            return False
            
    except (ConnectionError, TimeoutError, RedisError) as e:
        logger.error(f"Redis health check failed: {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Unexpected error during Redis health check: {e}", exc_info=True)
        return False


async def init_redis() -> None:
    """
    Initialize Redis connection pool.
    
    This function should be called during application startup to:
    - Create the connection pool
    - Initialize the async client
    - Verify Redis connectivity
    
    Raises:
        Exception: If Redis initialization fails
    """
    try:
        logger.info("Initializing Redis connection pool")
        
        # Create connection pool and client
        pool = get_connection_pool()
        client = get_client()
        
        # Verify connectivity with health check
        is_healthy = await check_redis_health()
        
        if not is_healthy:
            raise Exception("Redis health check failed during initialization")
        
        logger.info("Redis initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize Redis: {e}", exc_info=True)
        raise


async def close_redis() -> None:
    """
    Close Redis connection pool and cleanup resources.
    
    This function should be called during application shutdown to:
    - Close all active connections
    - Dispose of the connection pool
    - Release Redis resources
    """
    global _client, _pool
    
    try:
        if _client is not None:
            logger.info("Closing Redis connection pool")
            await _client.close()
            _client = None
            
        if _pool is not None:
            await _pool.disconnect()
            _pool = None
            
        logger.info("Redis connection pool closed")
    except Exception as e:
        logger.error(f"Error closing Redis connection: {e}", exc_info=True)
        raise


async def get_pool_info() -> dict:
    """
    Get current connection pool information for monitoring.
    
    Returns:
        dict: Connection pool statistics including:
            - max_connections: Maximum number of connections in pool
            - is_connected: Whether client is connected
            - socket_timeout: Socket operation timeout
            - health_check_interval: Health check frequency
    """
    pool = get_connection_pool()
    
    try:
        is_connected = await check_redis_health()
        
        return {
            "max_connections": 20,
            "is_connected": is_connected,
            "socket_timeout": 5,
            "socket_connect_timeout": 5,
            "health_check_interval": 30,
            "retry_on_timeout": True,
        }
    except Exception as e:
        logger.error(f"Error getting Redis pool info: {e}", exc_info=True)
        return {
            "max_connections": 20,
            "is_connected": False,
            "error": str(e),
        }


# Cache Helper Functions

async def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from cache.
    
    Args:
        key: Cache key
        
    Returns:
        Cached value (deserialized from JSON) or None if not found
    """
    try:
        client = get_client()
        value = await client.get(key)
        
        if value is None:
            logger.debug(f"Cache miss: {key}")
            return None
        
        # Deserialize JSON
        result = json.loads(value)
        logger.debug(f"Cache hit: {key}")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to deserialize cached value for key {key}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error getting cache key {key}: {e}", exc_info=True)
        return None


async def cache_set(
    key: str,
    value: Any,
    ttl: Optional[int] = None
) -> bool:
    """
    Set a value in cache with optional TTL.
    
    Args:
        key: Cache key
        value: Value to cache (will be serialized to JSON)
        ttl: Time-to-live in seconds (default: 1 hour)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        client = get_client()
        
        # Serialize to JSON
        serialized = json.dumps(value)
        
        # Set with TTL
        if ttl is None:
            ttl = CACHE_TTL_DEFAULT
        
        await client.setex(key, ttl, serialized)
        logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
        return True
        
    except (TypeError, ValueError) as e:
        logger.error(f"Failed to serialize value for key {key}: {e}")
        return False
    except Exception as e:
        logger.error(f"Error setting cache key {key}: {e}", exc_info=True)
        return False


async def cache_delete(key: str) -> bool:
    """
    Delete a value from cache.
    
    Args:
        key: Cache key to delete
        
    Returns:
        bool: True if key was deleted, False otherwise
    """
    try:
        client = get_client()
        result = await client.delete(key)
        
        if result > 0:
            logger.debug(f"Cache deleted: {key}")
            return True
        else:
            logger.debug(f"Cache key not found: {key}")
            return False
            
    except Exception as e:
        logger.error(f"Error deleting cache key {key}: {e}", exc_info=True)
        return False


async def cache_invalidate_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "product:*", "market:trends:*")
        
    Returns:
        int: Number of keys deleted
    """
    try:
        client = get_client()
        
        # Find all keys matching pattern
        keys = []
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        
        if not keys:
            logger.debug(f"No keys found matching pattern: {pattern}")
            return 0
        
        # Delete all matching keys
        deleted = await client.delete(*keys)
        logger.info(f"Cache invalidated: {deleted} keys matching pattern {pattern}")
        return deleted
        
    except Exception as e:
        logger.error(f"Error invalidating cache pattern {pattern}: {e}", exc_info=True)
        return 0


async def cache_exists(key: str) -> bool:
    """
    Check if a cache key exists.
    
    Args:
        key: Cache key to check
        
    Returns:
        bool: True if key exists, False otherwise
    """
    try:
        client = get_client()
        result = await client.exists(key)
        return result > 0
        
    except Exception as e:
        logger.error(f"Error checking cache key existence {key}: {e}", exc_info=True)
        return False


async def cache_get_ttl(key: str) -> Optional[int]:
    """
    Get the remaining TTL for a cache key.
    
    Args:
        key: Cache key
        
    Returns:
        int: Remaining TTL in seconds, or None if key doesn't exist or has no TTL
    """
    try:
        client = get_client()
        ttl = await client.ttl(key)
        
        if ttl == -2:  # Key doesn't exist
            return None
        elif ttl == -1:  # Key exists but has no TTL
            return None
        else:
            return ttl
            
    except Exception as e:
        logger.error(f"Error getting TTL for cache key {key}: {e}", exc_info=True)
        return None


async def cache_set_multiple(
    items: dict[str, Any],
    ttl: Optional[int] = None
) -> bool:
    """
    Set multiple values in cache with optional TTL.
    
    Args:
        items: Dictionary of key-value pairs to cache
        ttl: Time-to-live in seconds (default: 1 hour)
        
    Returns:
        bool: True if all successful, False otherwise
    """
    try:
        client = get_client()
        
        if ttl is None:
            ttl = CACHE_TTL_DEFAULT
        
        # Use pipeline for atomic operations
        async with client.pipeline(transaction=True) as pipe:
            for key, value in items.items():
                serialized = json.dumps(value)
                pipe.setex(key, ttl, serialized)
            
            await pipe.execute()
        
        logger.debug(f"Cache set multiple: {len(items)} keys (TTL: {ttl}s)")
        return True
        
    except Exception as e:
        logger.error(f"Error setting multiple cache keys: {e}", exc_info=True)
        return False


async def cache_get_multiple(keys: list[str]) -> dict[str, Any]:
    """
    Get multiple values from cache.
    
    Args:
        keys: List of cache keys to retrieve
        
    Returns:
        dict: Dictionary of key-value pairs (only includes found keys)
    """
    try:
        client = get_client()
        
        # Get all values
        values = await client.mget(keys)
        
        # Build result dictionary (only include found keys)
        result = {}
        for key, value in zip(keys, values):
            if value is not None:
                try:
                    result[key] = json.loads(value)
                except json.JSONDecodeError:
                    logger.error(f"Failed to deserialize cached value for key {key}")
        
        logger.debug(f"Cache get multiple: {len(result)}/{len(keys)} keys found")
        return result
        
    except Exception as e:
        logger.error(f"Error getting multiple cache keys: {e}", exc_info=True)
        return {}


# Convenience functions for specific cache types

async def cache_product_search(query: str, filters: dict, results: Any) -> bool:
    """
    Cache product search results.
    
    Args:
        query: Search query
        filters: Search filters
        results: Search results to cache
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Create cache key from query and filters
    key = f"product:search:{query}:{json.dumps(filters, sort_keys=True)}"
    return await cache_set(key, results, ttl=CACHE_TTL_PRODUCT_SEARCH)


async def cache_market_trends(category: str, geography: str, trends: Any) -> bool:
    """
    Cache market trend data.
    
    Args:
        category: Product category
        geography: Geographic region
        trends: Trend data to cache
        
    Returns:
        bool: True if successful, False otherwise
    """
    key = f"market:trends:{category}:{geography}"
    return await cache_set(key, trends, ttl=CACHE_TTL_MARKET_TRENDS)


async def cache_shipping_calculation(params: dict, calculation: Any) -> bool:
    """
    Cache shipping calculation results.
    
    Args:
        params: Shipping calculation parameters
        calculation: Calculation results to cache
        
    Returns:
        bool: True if successful, False otherwise
    """
    key = f"shipping:calc:{json.dumps(params, sort_keys=True)}"
    return await cache_set(key, calculation, ttl=CACHE_TTL_SHIPPING_CALC)


async def cache_ai_response(prompt_hash: str, response: Any) -> bool:
    """
    Cache AI model response.
    
    Args:
        prompt_hash: Hash of the prompt
        response: AI response to cache
        
    Returns:
        bool: True if successful, False otherwise
    """
    key = f"ai:response:{prompt_hash}"
    return await cache_set(key, response, ttl=CACHE_TTL_AI_RESPONSE)
