"""
MongoDB Database Connection Module

This module provides async MongoDB connection management using motor (async MongoDB driver).
It implements connection pooling, health checks, retry logic, and proper resource cleanup.

Requirements:
- 9.1: Store scraped product data in Document_Database
- 9.2: Index products by category, platform, and price range
"""

import logging
from typing import Optional
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import (
    ConnectionFailure,
    ServerSelectionTimeoutError,
    OperationFailure,
)

from app.config import settings

logger = logging.getLogger(__name__)

# Global MongoDB client and database
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None

# Collection names
PRODUCTS_COLLECTION = "products"
MARKET_TRENDS_COLLECTION = "market_trends"
SCRAPING_JOBS_COLLECTION = "scraping_jobs"


def get_client() -> AsyncIOMotorClient:
    """
    Get or create the global async MongoDB client.
    
    Connection pool configuration:
    - maxPoolSize: 20 connections (maximum pool size)
    - minPoolSize: 10 connections (minimum pool size)
    - maxIdleTimeMS: 45000 (45 seconds idle timeout)
    - serverSelectionTimeoutMS: 5000 (5 seconds server selection timeout)
    - connectTimeoutMS: 10000 (10 seconds connection timeout)
    - socketTimeoutMS: 60000 (60 seconds socket timeout)
    - retryWrites: True (automatic retry for write operations)
    - retryReads: True (automatic retry for read operations)
    
    Returns:
        AsyncIOMotorClient: Motor async MongoDB client instance
    """
    global _client
    
    if _client is None:
        logger.info("Creating MongoDB async client with connection pool")
        
        # Create async MongoDB client with connection pooling
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            maxPoolSize=20,  # Maximum number of connections in pool
            minPoolSize=10,  # Minimum number of connections in pool
            maxIdleTimeMS=45000,  # Close idle connections after 45 seconds
            serverSelectionTimeoutMS=5000,  # 5 seconds to select server
            connectTimeoutMS=10000,  # 10 seconds to establish connection
            socketTimeoutMS=60000,  # 60 seconds for socket operations
            retryWrites=True,  # Automatic retry for write operations
            retryReads=True,  # Automatic retry for read operations
            appname="ventureos_backend",
        )
        
        logger.info(
            f"MongoDB client created: maxPoolSize=20, minPoolSize=10, "
            f"serverSelectionTimeout=5s"
        )
    
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """
    Get or create the global async MongoDB database instance.
    
    Returns:
        AsyncIOMotorDatabase: Motor async MongoDB database
    """
    global _database
    
    if _database is None:
        client = get_client()
        _database = client[settings.MONGODB_DB]
        logger.info(f"MongoDB database instance created: {settings.MONGODB_DB}")
    
    return _database


def get_collection(collection_name: str):
    """
    Get a MongoDB collection by name.
    
    Args:
        collection_name: Name of the collection to retrieve
        
    Returns:
        AsyncIOMotorCollection: Motor async MongoDB collection
    """
    database = get_database()
    return database[collection_name]


async def check_database_health() -> bool:
    """
    Perform a health check to verify MongoDB connectivity.
    
    This function executes a simple ping command to verify that:
    - MongoDB connection is established
    - Connection pool is functioning
    - MongoDB server is responsive
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        client = get_client()
        # Ping the database to check connectivity
        await client.admin.command("ping")
        logger.debug("MongoDB health check passed")
        return True
        
    except (ConnectionFailure, ServerSelectionTimeoutError, OperationFailure) as e:
        logger.error(f"MongoDB health check failed: {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Unexpected error during MongoDB health check: {e}", exc_info=True)
        return False


async def init_db() -> None:
    """
    Initialize MongoDB connection with retry logic.
    
    This function should be called during application startup to:
    - Create the async client
    - Initialize the connection pool
    - Verify database connectivity with retries
    - Create necessary indexes
    
    Implements connection retry logic:
    - Maximum 3 retry attempts
    - Exponential backoff: 1s, 2s, 4s
    
    Raises:
        Exception: If database initialization fails after all retries
    """
    max_retries = 3
    retry_delays = [1, 2, 4]  # Exponential backoff in seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(
                f"Initializing MongoDB database connection pool (attempt {attempt + 1}/{max_retries})"
            )
            
            # Create client and database
            client = get_client()
            database = get_database()
            
            # Verify connectivity with health check
            is_healthy = await check_database_health()
            
            if not is_healthy:
                raise ConnectionFailure("MongoDB health check failed during initialization")
            
            # Create indexes for collections
            await create_indexes()
            
            logger.info("MongoDB database initialized successfully")
            return
            
        except (ConnectionFailure, ServerSelectionTimeoutError, OperationFailure) as e:
            logger.warning(
                f"MongoDB initialization attempt {attempt + 1} failed: {e}"
            )
            
            if attempt < max_retries - 1:
                delay = retry_delays[attempt]
                logger.info(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"Failed to initialize MongoDB after {max_retries} attempts"
                )
                raise Exception(
                    f"MongoDB initialization failed after {max_retries} retries: {e}"
                )
        except Exception as e:
            logger.error(f"Unexpected error initializing MongoDB: {e}", exc_info=True)
            raise


async def create_indexes() -> None:
    """
    Create indexes for MongoDB collections.
    
    Indexes created:
    - products: category, platform, price_range.min, price_range.max
    - market_trends: product_category, geography, created_at
    - scraping_jobs: site_name, status, scheduled_at
    
    Requirements:
    - 9.2: Index products by category, platform, and price range
    """
    try:
        database = get_database()
        
        # Products collection indexes
        products_collection = database[PRODUCTS_COLLECTION]
        await products_collection.create_index("category")
        await products_collection.create_index("platform")
        await products_collection.create_index("price_range.min")
        await products_collection.create_index("price_range.max")
        await products_collection.create_index([("category", 1), ("platform", 1)])
        await products_collection.create_index("last_updated")
        logger.info("Created indexes for products collection")
        
        # Market trends collection indexes
        market_trends_collection = database[MARKET_TRENDS_COLLECTION]
        await market_trends_collection.create_index("product_category")
        await market_trends_collection.create_index("geography")
        await market_trends_collection.create_index("created_at")
        await market_trends_collection.create_index(
            [("product_category", 1), ("geography", 1)]
        )
        logger.info("Created indexes for market_trends collection")
        
        # Scraping jobs collection indexes
        scraping_jobs_collection = database[SCRAPING_JOBS_COLLECTION]
        await scraping_jobs_collection.create_index("site_name")
        await scraping_jobs_collection.create_index("status")
        await scraping_jobs_collection.create_index("scheduled_at")
        await scraping_jobs_collection.create_index(
            [("site_name", 1), ("status", 1)]
        )
        logger.info("Created indexes for scraping_jobs collection")
        
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}", exc_info=True)
        raise


async def close_db() -> None:
    """
    Close MongoDB connection pool and cleanup resources.
    
    This function should be called during application shutdown to:
    - Close all active connections
    - Dispose of the connection pool
    - Release database resources
    """
    global _client, _database
    
    try:
        if _client is not None:
            logger.info("Closing MongoDB database connection pool")
            _client.close()
            _client = None
            _database = None
            logger.info("MongoDB database connection pool closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB database: {e}", exc_info=True)
        raise


async def get_connection_stats() -> dict:
    """
    Get current connection pool statistics for monitoring.
    
    Returns:
        dict: Connection pool statistics including:
            - database_name: Name of the database
            - max_pool_size: Maximum number of connections in pool
            - min_pool_size: Minimum number of connections in pool
            - is_connected: Whether client is connected
    """
    client = get_client()
    database = get_database()
    
    try:
        # Check if connected by pinging
        is_connected = await check_database_health()
        
        return {
            "database_name": database.name,
            "max_pool_size": 20,
            "min_pool_size": 10,
            "is_connected": is_connected,
            "server_selection_timeout_ms": 5000,
            "connection_timeout_ms": 10000,
            "socket_timeout_ms": 60000,
        }
    except Exception as e:
        logger.error(f"Error getting MongoDB connection stats: {e}", exc_info=True)
        return {
            "database_name": database.name,
            "max_pool_size": 20,
            "min_pool_size": 10,
            "is_connected": False,
            "error": str(e),
        }


# Convenience functions for accessing collections
def get_products_collection():
    """Get the products collection."""
    return get_collection(PRODUCTS_COLLECTION)


def get_market_trends_collection():
    """Get the market_trends collection."""
    return get_collection(MARKET_TRENDS_COLLECTION)


def get_scraping_jobs_collection():
    """Get the scraping_jobs collection."""
    return get_collection(SCRAPING_JOBS_COLLECTION)
