"""
Product Model for MongoDB

This module defines the Product document model for MongoDB storage.
It provides helper methods for CRUD operations, indexing, and data validation.

Requirements:
- 9.1: Store scraped product data in Document_Database
- 9.2: Index products by category, platform, and price range
- 9.3: Store product images as URLs referencing external sources
- 9.4: Flag products older than 7 days as stale
- 9.7: Translate Chinese product titles and descriptions using Local_AI_Model
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.db.mongodb import get_products_collection

logger = logging.getLogger(__name__)


class ProductModel:
    """
    MongoDB Product document model.
    
    This class provides methods for interacting with the products collection
    in MongoDB. It handles document creation, retrieval, updates, and indexing.
    
    Document Schema:
    {
        "_id": UUID (string),
        "title": str,
        "title_translated": str (optional),
        "description": str,
        "description_translated": str (optional),
        "images": List[str],
        "platform": str,
        "price_range": {
            "min": float,
            "max": float,
            "currency": str
        },
        "quality_tier": str,
        "moq": int,
        "supplier_info": {
            "name": str,
            "rating": float,
            "years_active": int,
            "response_rate": float,
            "reliability_score": float
        },
        "lead_time": str,
        "shipping_options": List[str],
        "category": str,
        "tags": List[str],
        "last_updated": datetime,
        "is_stale": bool,
        "created_at": datetime,
        "updated_at": datetime
    }
    """
    
    COLLECTION_NAME = "products"
    STALE_THRESHOLD_DAYS = 7
    
    @staticmethod
    def get_collection() -> AsyncIOMotorCollection:
        """
        Get the products collection from MongoDB.
        
        Returns:
            AsyncIOMotorCollection: Products collection instance
        """
        return get_products_collection()
    
    @staticmethod
    async def create_indexes() -> None:
        """
        Create indexes for the products collection.
        
        Indexes created:
        - category (ascending)
        - platform (ascending)
        - price_range.min (ascending)
        - price_range.max (ascending)
        - category + platform (compound index)
        - last_updated (descending)
        - is_stale (ascending)
        
        Requirements:
        - 9.2: Index products by category, platform, and price range
        """
        try:
            collection = ProductModel.get_collection()
            
            # Define indexes
            indexes = [
                IndexModel([("category", ASCENDING)], name="idx_category"),
                IndexModel([("platform", ASCENDING)], name="idx_platform"),
                IndexModel([("price_range.min", ASCENDING)], name="idx_price_min"),
                IndexModel([("price_range.max", ASCENDING)], name="idx_price_max"),
                IndexModel(
                    [("category", ASCENDING), ("platform", ASCENDING)],
                    name="idx_category_platform"
                ),
                IndexModel([("last_updated", DESCENDING)], name="idx_last_updated"),
                IndexModel([("is_stale", ASCENDING)], name="idx_is_stale"),
                IndexModel([("quality_tier", ASCENDING)], name="idx_quality_tier"),
                IndexModel([("tags", ASCENDING)], name="idx_tags"),
            ]
            
            # Create indexes
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for products collection")
            
        except Exception as e:
            logger.error(f"Error creating product indexes: {e}", exc_info=True)
            raise
    
    @staticmethod
    def _is_stale(last_updated: datetime) -> bool:
        """
        Check if a product is stale based on last_updated timestamp.
        
        Args:
            last_updated: Last update timestamp
            
        Returns:
            bool: True if product is older than 7 days, False otherwise
            
        Requirements:
        - 9.4: Flag products older than 7 days as stale
        """
        threshold = datetime.utcnow() - timedelta(days=ProductModel.STALE_THRESHOLD_DAYS)
        return last_updated < threshold
    
    @staticmethod
    async def create(product_data: Dict) -> str:
        """
        Create a new product document in MongoDB.
        
        Args:
            product_data: Product data dictionary matching the schema
            
        Returns:
            str: Product ID (UUID as string)
            
        Raises:
            ValueError: If required fields are missing
            DuplicateKeyError: If product with same ID already exists
            
        Requirements:
        - 9.1: Store scraped product data in Document_Database
        - 9.3: Store product images as URLs referencing external sources
        """
        try:
            collection = ProductModel.get_collection()
            
            # Generate UUID if not provided
            if "_id" not in product_data:
                product_data["_id"] = str(uuid4())
            
            # Set timestamps
            now = datetime.utcnow()
            product_data["created_at"] = now
            product_data["updated_at"] = now
            
            # Set last_updated if not provided
            if "last_updated" not in product_data:
                product_data["last_updated"] = now
            
            # Calculate is_stale flag
            product_data["is_stale"] = ProductModel._is_stale(
                product_data["last_updated"]
            )
            
            # Validate required fields
            required_fields = [
                "title", "description", "platform", "price_range",
                "quality_tier", "moq", "supplier_info", "lead_time",
                "category"
            ]
            missing_fields = [f for f in required_fields if f not in product_data]
            if missing_fields:
                raise ValueError(f"Missing required fields: {missing_fields}")
            
            # Insert document
            result = await collection.insert_one(product_data)
            logger.info(f"Created product: {result.inserted_id}")
            
            return str(result.inserted_id)
            
        except DuplicateKeyError as e:
            logger.error(f"Duplicate product ID: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating product: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def get_by_id(product_id: str) -> Optional[Dict]:
        """
        Retrieve a product by ID.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            dict | None: Product document or None if not found
        """
        try:
            collection = ProductModel.get_collection()
            product = await collection.find_one({"_id": product_id})
            
            if product:
                logger.debug(f"Retrieved product: {product_id}")
            else:
                logger.debug(f"Product not found: {product_id}")
            
            return product
            
        except Exception as e:
            logger.error(f"Error retrieving product {product_id}: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def update(product_id: str, update_data: Dict) -> bool:
        """
        Update a product document.
        
        Args:
            product_id: Product UUID as string
            update_data: Dictionary of fields to update
            
        Returns:
            bool: True if product was updated, False if not found
        """
        try:
            collection = ProductModel.get_collection()
            
            # Set updated_at timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Recalculate is_stale if last_updated is being updated
            if "last_updated" in update_data:
                update_data["is_stale"] = ProductModel._is_stale(
                    update_data["last_updated"]
                )
            
            # Update document
            result = await collection.update_one(
                {"_id": product_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated product: {product_id}")
                return True
            else:
                logger.debug(f"Product not found or no changes: {product_id}")
                return False
            
        except Exception as e:
            logger.error(f"Error updating product {product_id}: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def delete(product_id: str) -> bool:
        """
        Delete a product document.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            bool: True if product was deleted, False if not found
        """
        try:
            collection = ProductModel.get_collection()
            result = await collection.delete_one({"_id": product_id})
            
            if result.deleted_count > 0:
                logger.info(f"Deleted product: {product_id}")
                return True
            else:
                logger.debug(f"Product not found: {product_id}")
                return False
            
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def search(
        query: Optional[str] = None,
        platforms: Optional[List[str]] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        quality_tier: Optional[str] = None,
        sort_by: str = "relevance",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Dict], int]:
        """
        Search products with filters and pagination.
        
        Args:
            query: Search query string (searches title and description)
            platforms: Filter by platforms
            category: Filter by category
            min_price: Minimum price filter
            max_price: Maximum price filter
            quality_tier: Filter by quality tier
            sort_by: Sort order (relevance, price, rating, moq)
            page: Page number (1-indexed)
            page_size: Items per page
            
        Returns:
            tuple: (list of products, total count)
            
        Requirements:
        - 7.2: Search products from multiple platforms
        - 7.5: Support filtering by platform, price range, quality tier
        - 7.6: Support sorting by price, rating, and MOQ
        - 7.7: Implement pagination with configurable page size up to 50 items
        """
        try:
            collection = ProductModel.get_collection()
            
            # Build query filter
            filter_query = {}
            
            # Text search on title and description
            if query:
                filter_query["$or"] = [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"title_translated": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"description_translated": {"$regex": query, "$options": "i"}},
                ]
            
            # Platform filter
            if platforms:
                filter_query["platform"] = {"$in": platforms}
            
            # Category filter
            if category:
                filter_query["category"] = category
            
            # Price range filter
            if min_price is not None or max_price is not None:
                price_filter = {}
                if min_price is not None:
                    price_filter["$gte"] = min_price
                if max_price is not None:
                    price_filter["$lte"] = max_price
                filter_query["price_range.min"] = price_filter
            
            # Quality tier filter
            if quality_tier:
                filter_query["quality_tier"] = quality_tier
            
            # Determine sort order
            sort_order = []
            if sort_by == "price":
                sort_order = [("price_range.min", ASCENDING)]
            elif sort_by == "rating":
                sort_order = [("supplier_info.rating", DESCENDING)]
            elif sort_by == "moq":
                sort_order = [("moq", ASCENDING)]
            else:  # relevance (default to last_updated)
                sort_order = [("last_updated", DESCENDING)]
            
            # Calculate pagination
            skip = (page - 1) * page_size
            
            # Execute query
            cursor = collection.find(filter_query).sort(sort_order).skip(skip).limit(page_size)
            products = await cursor.to_list(length=page_size)
            
            # Get total count
            total = await collection.count_documents(filter_query)
            
            logger.debug(
                f"Product search: query={query}, filters={filter_query}, "
                f"results={len(products)}, total={total}"
            )
            
            return products, total
            
        except Exception as e:
            logger.error(f"Error searching products: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def mark_stale_products() -> int:
        """
        Mark products older than 7 days as stale.
        
        This should be run periodically (e.g., daily) to update the is_stale flag
        for products that have exceeded the staleness threshold.
        
        Returns:
            int: Number of products marked as stale
            
        Requirements:
        - 9.4: Flag products older than 7 days as stale
        """
        try:
            collection = ProductModel.get_collection()
            
            # Calculate threshold date
            threshold = datetime.utcnow() - timedelta(days=ProductModel.STALE_THRESHOLD_DAYS)
            
            # Update stale products
            result = await collection.update_many(
                {
                    "last_updated": {"$lt": threshold},
                    "is_stale": False
                },
                {
                    "$set": {
                        "is_stale": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Marked {result.modified_count} products as stale")
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error marking stale products: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def get_stale_products(limit: int = 100) -> List[Dict]:
        """
        Get products that are marked as stale.
        
        Args:
            limit: Maximum number of products to return
            
        Returns:
            list: List of stale product documents
        """
        try:
            collection = ProductModel.get_collection()
            cursor = collection.find({"is_stale": True}).limit(limit)
            products = await cursor.to_list(length=limit)
            
            logger.debug(f"Retrieved {len(products)} stale products")
            return products
            
        except Exception as e:
            logger.error(f"Error retrieving stale products: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def bulk_create(products: List[Dict]) -> int:
        """
        Bulk insert multiple products.
        
        Args:
            products: List of product data dictionaries
            
        Returns:
            int: Number of products inserted
            
        Requirements:
        - 8.7: Store scraping results in Document_Database
        """
        try:
            if not products:
                return 0
            
            collection = ProductModel.get_collection()
            
            # Prepare documents
            now = datetime.utcnow()
            for product in products:
                if "_id" not in product:
                    product["_id"] = str(uuid4())
                product["created_at"] = now
                product["updated_at"] = now
                if "last_updated" not in product:
                    product["last_updated"] = now
                product["is_stale"] = ProductModel._is_stale(product["last_updated"])
            
            # Bulk insert
            result = await collection.insert_many(products, ordered=False)
            inserted_count = len(result.inserted_ids)
            
            logger.info(f"Bulk inserted {inserted_count} products")
            return inserted_count
            
        except Exception as e:
            logger.error(f"Error bulk creating products: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def get_by_platform(platform: str, limit: int = 100) -> List[Dict]:
        """
        Get products by platform.
        
        Args:
            platform: Platform name (alibaba, pinduoduo, etc.)
            limit: Maximum number of products to return
            
        Returns:
            list: List of product documents
        """
        try:
            collection = ProductModel.get_collection()
            cursor = collection.find({"platform": platform}).limit(limit)
            products = await cursor.to_list(length=limit)
            
            logger.debug(f"Retrieved {len(products)} products from {platform}")
            return products
            
        except Exception as e:
            logger.error(f"Error retrieving products by platform: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def get_by_category(category: str, limit: int = 100) -> List[Dict]:
        """
        Get products by category.
        
        Args:
            category: Product category
            limit: Maximum number of products to return
            
        Returns:
            list: List of product documents
        """
        try:
            collection = ProductModel.get_collection()
            cursor = collection.find({"category": category}).limit(limit)
            products = await cursor.to_list(length=limit)
            
            logger.debug(f"Retrieved {len(products)} products in category {category}")
            return products
            
        except Exception as e:
            logger.error(f"Error retrieving products by category: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def count_all() -> int:
        """
        Get total count of all products.
        
        Returns:
            int: Total number of products
        """
        try:
            collection = ProductModel.get_collection()
            count = await collection.count_documents({})
            return count
            
        except Exception as e:
            logger.error(f"Error counting products: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def count_by_platform() -> Dict[str, int]:
        """
        Get product count grouped by platform.
        
        Returns:
            dict: Platform name to count mapping
        """
        try:
            collection = ProductModel.get_collection()
            
            pipeline = [
                {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            cursor = collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            counts = {item["_id"]: item["count"] for item in results}
            logger.debug(f"Product counts by platform: {counts}")
            
            return counts
            
        except Exception as e:
            logger.error(f"Error counting products by platform: {e}", exc_info=True)
            raise
