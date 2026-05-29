"""
Product Service

This module provides business logic for product search and management.
It wraps the ProductModel and adds conversion between MongoDB documents
and Pydantic schemas, along with additional business logic.

Requirements:
- 7.1: Provide /api/v1/products/search endpoint accepting query, platforms, and filters
- 7.2: Search products from multiple platforms
- 7.3: Return results within 2 seconds
- 7.5: Support filtering by platform, price range, quality tier, and shipping time
- 7.6: Support sorting by price, rating, and MOQ
- 7.7: Implement pagination with configurable page size up to 50 items
- 9.5: Implement full-text search using Meilisearch for Bengali and English queries
- 9.6: Cache frequently accessed product data in Cache_Layer for 1 hour
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from app.db.meilisearch import get_meilisearch_client
from app.db.redis import cache_get, cache_set, cache_delete, CACHE_TTL_PRODUCT_SEARCH
from app.models.product import ProductModel
from app.schemas.product import (
    Product,
    ProductSearchRequest,
    ProductSearchResponse,
    PaginationMeta,
    PriceRange,
    SupplierInfo,
)

logger = logging.getLogger(__name__)


class ProductService:
    """
    Service layer for product operations.
    
    This class provides business logic for product search and management,
    handling conversion between MongoDB documents and Pydantic schemas.
    Implements caching for frequently accessed products.
    """
    
    # Cache key prefixes
    CACHE_KEY_PRODUCT = "product:detail:"
    CACHE_KEY_SEARCH = "product:search:"
    CACHE_KEY_POPULAR = "product:popular"
    
    # Cache TTL (1 hour for products)
    CACHE_TTL_PRODUCT = 3600  # 1 hour
    
    @staticmethod
    def _generate_search_cache_key(request: ProductSearchRequest) -> str:
        """
        Generate a cache key for a search request.
        
        Args:
            request: Product search request
            
        Returns:
            str: Cache key
        """
        # Create a deterministic representation of the search request
        search_params = {
            "query": request.query,
            "platforms": sorted(request.platforms) if request.platforms else None,
            "min_price": request.min_price,
            "max_price": request.max_price,
            "quality_tier": request.quality_tier,
            "sort_by": request.sort_by,
            "page": request.page,
            "page_size": request.page_size,
        }
        
        # Create a hash of the search parameters
        params_json = json.dumps(search_params, sort_keys=True)
        params_hash = hashlib.md5(params_json.encode()).hexdigest()
        
        return f"{ProductService.CACHE_KEY_SEARCH}{params_hash}"
    
    @staticmethod
    def _document_to_schema(doc: dict) -> Product:
        """
        Convert MongoDB document to Pydantic Product schema.
        
        Args:
            doc: MongoDB product document
            
        Returns:
            Product: Pydantic schema instance
        """
        # Convert _id to id
        product_id = doc.get("_id")
        if isinstance(product_id, str):
            product_id = UUID(product_id)
        
        # Convert price_range
        price_range_data = doc.get("price_range", {})
        price_range = PriceRange(
            min=price_range_data.get("min", 0),
            max=price_range_data.get("max", 0),
            currency=price_range_data.get("currency", "BDT"),
        )
        
        # Convert supplier_info
        supplier_data = doc.get("supplier_info", {})
        supplier_info = SupplierInfo(
            name=supplier_data.get("name", "Unknown"),
            rating=supplier_data.get("rating", 0.0),
            years_active=supplier_data.get("years_active", 0),
            response_rate=supplier_data.get("response_rate", 0.0),
            reliability_score=supplier_data.get("reliability_score", 0.0),
        )
        
        # Convert last_updated to datetime if it's a string
        last_updated = doc.get("last_updated")
        if isinstance(last_updated, str):
            last_updated = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
        
        # Convert price_history
        from app.schemas.product import PriceHistoryEntry
        price_history_data = doc.get("price_history", [])
        price_history = []
        for entry in price_history_data:
            entry_date = entry.get("date")
            if isinstance(entry_date, str):
                entry_date = datetime.fromisoformat(entry_date.replace("Z", "+00:00"))
            price_history.append(PriceHistoryEntry(
                date=entry_date,
                price=entry.get("price", 0.0)
            ))
        
        # Convert similar_products to UUIDs
        similar_products_data = doc.get("similar_products", [])
        similar_products = []
        for sp_id in similar_products_data:
            if isinstance(sp_id, str):
                similar_products.append(UUID(sp_id))
            else:
                similar_products.append(sp_id)
        
        # Create Product schema
        return Product(
            id=product_id,
            title=doc.get("title", ""),
            title_translated=doc.get("title_translated"),
            description=doc.get("description", ""),
            description_translated=doc.get("description_translated"),
            images=doc.get("images", []),
            platform=doc.get("platform", ""),
            price_range=price_range,
            quality_tier=doc.get("quality_tier", "medium"),
            moq=doc.get("moq", 1),
            supplier_info=supplier_info,
            lead_time=doc.get("lead_time", ""),
            shipping_options=doc.get("shipping_options", []),
            specifications=doc.get("specifications"),
            price_history=price_history,
            similar_products=similar_products,
            category=doc.get("category", ""),
            tags=doc.get("tags", []),
            last_updated=last_updated,
            is_stale=doc.get("is_stale", False),
        )
    
    @staticmethod
    def _build_meilisearch_filter(
        platforms: Optional[List[str]] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        quality_tier: Optional[str] = None,
    ) -> Optional[str]:
        """
        Build Meilisearch filter expression from search parameters.
        
        Args:
            platforms: Filter by platforms
            min_price: Minimum price filter
            max_price: Maximum price filter
            quality_tier: Filter by quality tier
            
        Returns:
            str | None: Filter expression or None if no filters
        """
        filters = []
        
        # Platform filter
        if platforms:
            platform_filters = [f"platform = {p}" for p in platforms]
            filters.append(f"({' OR '.join(platform_filters)})")
        
        # Price range filter
        if min_price is not None:
            filters.append(f"price_range.min >= {min_price}")
        if max_price is not None:
            filters.append(f"price_range.max <= {max_price}")
        
        # Quality tier filter
        if quality_tier:
            filters.append(f"quality_tier = {quality_tier}")
        
        # Combine filters with AND
        if filters:
            return " AND ".join(filters)
        return None
    
    @staticmethod
    def _build_meilisearch_sort(sort_by: str) -> Optional[List[str]]:
        """
        Build Meilisearch sort expression from sort parameter.
        
        Args:
            sort_by: Sort order (relevance, price, rating, moq)
            
        Returns:
            list[str] | None: Sort expressions or None for relevance
        """
        if sort_by == "price":
            return ["price_range.min:asc"]
        elif sort_by == "rating":
            return ["supplier_info.rating:desc"]
        elif sort_by == "moq":
            return ["moq:asc"]
        else:  # relevance (default)
            return None
    
    @staticmethod
    async def search(
        request: ProductSearchRequest,
    ) -> ProductSearchResponse:
        """
        Search products with filters, sorting, and pagination using Meilisearch.
        
        This method uses Meilisearch for full-text search with support for
        Bengali and English queries, then falls back to MongoDB for complex
        filters if needed. Results are cached for 1 hour.
        
        Args:
            request: Product search request with filters and pagination
            
        Returns:
            ProductSearchResponse: Search results with pagination metadata
            
        Requirements:
        - 7.1: Accept query, platforms, and filters
        - 7.2: Search products from multiple platforms
        - 7.3: Return results within 2 seconds
        - 7.5: Support filtering by platform, price range, quality tier, and shipping time
        - 7.6: Support sorting by price, rating, and MOQ
        - 7.7: Implement pagination with configurable page size up to 50 items
        - 9.5: Implement full-text search using Meilisearch for Bengali and English queries
        - 9.6: Cache frequently accessed product data in Cache_Layer for 1 hour
        """
        try:
            logger.info(
                f"Product search: query='{request.query}', platforms={request.platforms}, "
                f"page={request.page}, page_size={request.page_size}"
            )
            
            # Check cache first
            cache_key = ProductService._generate_search_cache_key(request)
            cached_response = await cache_get(cache_key)
            
            if cached_response:
                logger.debug(f"Cache hit for search: {cache_key}")
                # Convert cached dict back to ProductSearchResponse
                return ProductSearchResponse(**cached_response)
            
            logger.debug(f"Cache miss for search: {cache_key}")
            
            # Use Meilisearch for full-text search
            meilisearch_client = get_meilisearch_client()
            
            # Build filter expression
            filter_expr = ProductService._build_meilisearch_filter(
                platforms=request.platforms,
                min_price=request.min_price,
                max_price=request.max_price,
                quality_tier=request.quality_tier,
            )
            
            # Build sort expression
            sort_expr = ProductService._build_meilisearch_sort(request.sort_by)
            
            # Calculate offset for pagination
            offset = (request.page - 1) * request.page_size
            
            # Execute search
            search_results = await meilisearch_client.search_products(
                query=request.query,
                filters=filter_expr,
                sort=sort_expr,
                limit=request.page_size,
                offset=offset,
            )
            
            # Extract hits and total count
            hits = search_results.get("hits", [])
            total = search_results.get("estimatedTotalHits", 0)
            
            # Convert hits to Product schemas
            products = []
            for hit in hits:
                # Convert Meilisearch hit to Product schema
                # Meilisearch returns documents with 'id' field
                product_id = hit.get("id")
                if isinstance(product_id, str):
                    product_id = UUID(product_id)
                
                # Convert price_range
                price_range_data = hit.get("price_range", {})
                price_range = PriceRange(
                    min=price_range_data.get("min", 0),
                    max=price_range_data.get("max", 0),
                    currency=price_range_data.get("currency", "BDT"),
                )
                
                # Convert supplier_info
                supplier_data = hit.get("supplier_info", {})
                supplier_info = SupplierInfo(
                    name=supplier_data.get("name", "Unknown"),
                    rating=supplier_data.get("rating", 0.0),
                    years_active=supplier_data.get("years_active", 0),
                    response_rate=supplier_data.get("response_rate", 0.0),
                    reliability_score=supplier_data.get("reliability_score", 0.0),
                )
                
                # Convert last_updated to datetime if it's a string
                last_updated = hit.get("last_updated")
                if isinstance(last_updated, str):
                    last_updated = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
                
                # Convert price_history
                from app.schemas.product import PriceHistoryEntry
                price_history_data = hit.get("price_history", [])
                price_history = []
                for entry in price_history_data:
                    entry_date = entry.get("date")
                    if isinstance(entry_date, str):
                        entry_date = datetime.fromisoformat(entry_date.replace("Z", "+00:00"))
                    price_history.append(PriceHistoryEntry(
                        date=entry_date,
                        price=entry.get("price", 0.0)
                    ))
                
                # Convert similar_products to UUIDs
                similar_products_data = hit.get("similar_products", [])
                similar_products = []
                for sp_id in similar_products_data:
                    if isinstance(sp_id, str):
                        similar_products.append(UUID(sp_id))
                    else:
                        similar_products.append(sp_id)
                
                # Create Product schema
                product = Product(
                    id=product_id,
                    title=hit.get("title", ""),
                    title_translated=hit.get("title_translated"),
                    description=hit.get("description", ""),
                    description_translated=hit.get("description_translated"),
                    images=hit.get("images", []),
                    platform=hit.get("platform", ""),
                    price_range=price_range,
                    quality_tier=hit.get("quality_tier", "medium"),
                    moq=hit.get("moq", 1),
                    supplier_info=supplier_info,
                    lead_time=hit.get("lead_time", ""),
                    shipping_options=hit.get("shipping_options", []),
                    specifications=hit.get("specifications"),
                    price_history=price_history,
                    similar_products=similar_products,
                    category=hit.get("category", ""),
                    tags=hit.get("tags", []),
                    last_updated=last_updated,
                    is_stale=hit.get("is_stale", False),
                )
                
                products.append(product)
            
            # Calculate pagination metadata
            has_more = (request.page * request.page_size) < total
            
            meta = PaginationMeta(
                page=request.page,
                page_size=request.page_size,
                total=total,
                has_more=has_more,
            )
            
            response = ProductSearchResponse(
                success=True,
                data=products,
                meta=meta,
            )
            
            # Cache the response
            await cache_set(
                cache_key,
                response.model_dump(),
                ttl=CACHE_TTL_PRODUCT_SEARCH
            )
            logger.debug(f"Cached search results: {cache_key}")
            
            logger.info(
                f"Product search completed: found {len(products)} products, "
                f"total={total}, has_more={has_more}"
            )
            
            return response
        
        except Exception as e:
            logger.error(f"Product search error: {e}", exc_info=True)
            # Return empty results on error
            return ProductSearchResponse(
                success=False,
                data=[],
                meta=PaginationMeta(
                    page=request.page,
                    page_size=request.page_size,
                    total=0,
                    has_more=False,
                ),
            )
    
    @staticmethod
    async def get_by_id(product_id: str) -> Optional[Product]:
        """
        Get a product by ID with caching.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            Product | None: Product schema or None if not found
            
        Requirements:
        - 9.6: Cache frequently accessed product data in Cache_Layer for 1 hour
        """
        try:
            # Check cache first
            cache_key = f"{ProductService.CACHE_KEY_PRODUCT}{product_id}"
            cached_data = await cache_get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for product: {product_id}")
                # Track access for popularity
                await ProductService.track_product_access(product_id)
                # Convert cached dict back to Product schema
                return Product(**cached_data)
            
            logger.debug(f"Cache miss for product: {product_id}")
            
            # Fetch from database
            doc = await ProductModel.get_by_id(product_id)
            
            if not doc:
                logger.debug(f"Product not found: {product_id}")
                return None
            
            # Convert to schema
            product = ProductService._document_to_schema(doc)
            
            # Cache the product data
            await cache_set(
                cache_key,
                product.model_dump(),
                ttl=ProductService.CACHE_TTL_PRODUCT
            )
            logger.debug(f"Cached product: {product_id}")
            
            # Track access for popularity
            await ProductService.track_product_access(product_id)
            
            return product
        
        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def get_by_platform(
        platform: str,
        limit: int = 100,
    ) -> List[Product]:
        """
        Get products by platform.
        
        Args:
            platform: Platform name (alibaba, pinduoduo, etc.)
            limit: Maximum number of products to return
            
        Returns:
            list[Product]: List of products
        """
        try:
            docs = await ProductModel.get_by_platform(platform, limit)
            
            return [
                ProductService._document_to_schema(doc)
                for doc in docs
            ]
        
        except Exception as e:
            logger.error(f"Error getting products by platform: {e}", exc_info=True)
            return []
    
    @staticmethod
    async def get_by_category(
        category: str,
        limit: int = 100,
    ) -> List[Product]:
        """
        Get products by category.
        
        Args:
            category: Product category
            limit: Maximum number of products to return
            
        Returns:
            list[Product]: List of products
        """
        try:
            docs = await ProductModel.get_by_category(category, limit)
            
            return [
                ProductService._document_to_schema(doc)
                for doc in docs
            ]
        
        except Exception as e:
            logger.error(f"Error getting products by category: {e}", exc_info=True)
            return []
    
    @staticmethod
    async def get_stale_products(limit: int = 100) -> List[Product]:
        """
        Get products that are marked as stale (older than 7 days).
        
        Args:
            limit: Maximum number of products to return
            
        Returns:
            list[Product]: List of stale products
        """
        try:
            docs = await ProductModel.get_stale_products(limit)
            
            return [
                ProductService._document_to_schema(doc)
                for doc in docs
            ]
        
        except Exception as e:
            logger.error(f"Error getting stale products: {e}", exc_info=True)
            return []
    
    @staticmethod
    async def count_all() -> int:
        """
        Get total count of all products.
        
        Returns:
            int: Total number of products
        """
        try:
            return await ProductModel.count_all()
        
        except Exception as e:
            logger.error(f"Error counting products: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def count_by_platform() -> dict:
        """
        Get product count grouped by platform.
        
        Returns:
            dict: Platform name to count mapping
        """
        try:
            return await ProductModel.count_by_platform()
        
        except Exception as e:
            logger.error(f"Error counting products by platform: {e}", exc_info=True)
            return {}
    
    @staticmethod
    async def index_product_in_search(product_id: str) -> bool:
        """
        Index a product in Meilisearch.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            bool: True if indexed successfully, False otherwise
            
        Requirements:
        - 9.3: Index products by title, description, category, tags
        """
        try:
            # Get product from MongoDB
            doc = await ProductModel.get_by_id(product_id)
            
            if not doc:
                logger.warning(f"Product not found for indexing: {product_id}")
                return False
            
            # Index in Meilisearch
            meilisearch_client = get_meilisearch_client()
            await meilisearch_client.index_product(doc)
            
            logger.info(f"Indexed product in search: {product_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error indexing product in search: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def index_all_products_in_search(batch_size: int = 1000) -> int:
        """
        Index all products from MongoDB into Meilisearch.
        
        This is useful for initial setup or re-indexing after changes.
        
        Args:
            batch_size: Number of products to index per batch
            
        Returns:
            int: Number of products indexed
            
        Requirements:
        - 9.3: Index products by title, description, category, tags
        """
        try:
            meilisearch_client = get_meilisearch_client()
            collection = ProductModel.get_collection()
            
            # Get total count
            total = await collection.count_documents({})
            logger.info(f"Starting to index {total} products in Meilisearch")
            
            # Process in batches
            indexed_count = 0
            skip = 0
            
            while skip < total:
                # Fetch batch from MongoDB
                cursor = collection.find({}).skip(skip).limit(batch_size)
                batch = await cursor.to_list(length=batch_size)
                
                if not batch:
                    break
                
                # Index batch in Meilisearch
                await meilisearch_client.index_products_bulk(batch)
                
                indexed_count += len(batch)
                skip += batch_size
                
                logger.info(f"Indexed {indexed_count}/{total} products")
            
            logger.info(f"Completed indexing {indexed_count} products in Meilisearch")
            return indexed_count
        
        except Exception as e:
            logger.error(f"Error indexing all products: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def remove_product_from_search(product_id: str) -> bool:
        """
        Remove a product from Meilisearch index.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            bool: True if removed successfully, False otherwise
        """
        try:
            meilisearch_client = get_meilisearch_client()
            await meilisearch_client.delete_product(product_id)
            
            logger.info(f"Removed product from search: {product_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error removing product from search: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def invalidate_product_cache(product_id: str) -> bool:
        """
        Invalidate cache for a specific product.
        
        This should be called when a product is updated or deleted.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            bool: True if cache was invalidated, False otherwise
            
        Requirements:
        - 9.6: Cache management for product data
        """
        try:
            cache_key = f"{ProductService.CACHE_KEY_PRODUCT}{product_id}"
            await cache_delete(cache_key)
            logger.info(f"Invalidated cache for product: {product_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error invalidating product cache: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def warm_popular_products_cache(limit: int = 100) -> int:
        """
        Warm the cache with popular products.
        
        This method fetches the most popular products (by category or recent searches)
        and pre-loads them into the cache. This should be run periodically to ensure
        frequently accessed products are always cached.
        
        Args:
            limit: Number of popular products to cache
            
        Returns:
            int: Number of products cached
            
        Requirements:
        - 9.6: Implement cache warming for popular products
        """
        try:
            logger.info(f"Starting cache warming for {limit} popular products")
            
            # Get popular product IDs from Redis sorted set
            # (This assumes we're tracking product access frequency)
            popular_ids = await ProductService._get_popular_product_ids(limit)
            
            if not popular_ids:
                # Fallback: get recent products from MongoDB
                logger.debug("No popular products tracked, using recent products")
                collection = ProductModel.get_collection()
                cursor = collection.find({}).sort("last_updated", -1).limit(limit)
                docs = await cursor.to_list(length=limit)
                popular_ids = [doc["_id"] for doc in docs]
            
            # Cache each popular product
            cached_count = 0
            for product_id in popular_ids:
                try:
                    # Fetch product from database
                    doc = await ProductModel.get_by_id(product_id)
                    
                    if doc:
                        # Convert to schema
                        product = ProductService._document_to_schema(doc)
                        
                        # Cache the product
                        cache_key = f"{ProductService.CACHE_KEY_PRODUCT}{product_id}"
                        await cache_set(
                            cache_key,
                            product.model_dump(),
                            ttl=ProductService.CACHE_TTL_PRODUCT
                        )
                        cached_count += 1
                
                except Exception as e:
                    logger.error(f"Error caching product {product_id}: {e}")
                    continue
            
            logger.info(f"Cache warming completed: cached {cached_count} products")
            return cached_count
        
        except Exception as e:
            logger.error(f"Error warming product cache: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def _get_popular_product_ids(limit: int) -> List[str]:
        """
        Get popular product IDs from Redis sorted set.
        
        This method retrieves product IDs sorted by access frequency.
        The sorted set is maintained by tracking product views/searches.
        
        Args:
            limit: Maximum number of product IDs to return
            
        Returns:
            list[str]: List of popular product IDs
        """
        try:
            from app.db.redis import get_client
            
            client = get_client()
            
            # Get top products from sorted set (sorted by access count)
            # ZREVRANGE returns members in descending order by score
            popular_ids = await client.zrevrange(
                ProductService.CACHE_KEY_POPULAR,
                0,
                limit - 1
            )
            
            # Convert bytes to strings if needed
            if popular_ids:
                popular_ids = [
                    pid.decode() if isinstance(pid, bytes) else pid
                    for pid in popular_ids
                ]
            
            logger.debug(f"Retrieved {len(popular_ids)} popular product IDs")
            return popular_ids
        
        except Exception as e:
            logger.error(f"Error getting popular product IDs: {e}", exc_info=True)
            return []
    
    @staticmethod
    async def track_product_access(product_id: str) -> bool:
        """
        Track product access for popularity tracking.
        
        This increments the access count for a product in Redis sorted set,
        which is used for cache warming.
        
        Args:
            product_id: Product UUID as string
            
        Returns:
            bool: True if tracked successfully, False otherwise
        """
        try:
            from app.db.redis import get_client
            
            client = get_client()
            
            # Increment score in sorted set
            await client.zincrby(
                ProductService.CACHE_KEY_POPULAR,
                1,
                product_id
            )
            
            logger.debug(f"Tracked access for product: {product_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error tracking product access: {e}", exc_info=True)
            return False

    @staticmethod
    async def translate_product(product_id: str) -> bool:
        """
        Translate Chinese product title and description to Bengali and English.

        This method fetches a product from MongoDB, translates its Chinese title
        and description to both Bengali and English using LocalAI, and stores
        the translations in the product document.

        Args:
            product_id: Product UUID as string

        Returns:
            bool: True if translation succeeded, False otherwise

        Requirements:
        - 9.7: Translate Chinese product titles and descriptions using Local_AI_Model

        Example:
            >>> success = await ProductService.translate_product("product-uuid")
            >>> if success:
            ...     print("Product translated successfully")
        """
        try:
            logger.info(f"Starting translation for product: {product_id}")

            # Get product from MongoDB
            doc = await ProductModel.get_by_id(product_id)

            if not doc:
                logger.warning(f"Product not found for translation: {product_id}")
                return False

            # Check if product has Chinese content
            title = doc.get("title", "")
            description = doc.get("description", "")

            if not title and not description:
                logger.warning(f"Product {product_id} has no title or description to translate")
                return False

            # Initialize LocalAI client
            from app.core.local_ai import LocalAI
            from app.config import settings

            local_ai = LocalAI(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                timeout=settings.OLLAMA_TIMEOUT
            )

            try:
                # Prepare translation data structure
                translations = {
                    "title_bn": None,
                    "title_en": None,
                    "description_bn": None,
                    "description_en": None
                }

                # Translate title to Bengali
                if title:
                    logger.debug(f"Translating title to Bengali: {title[:50]}...")
                    title_bn_result = await local_ai.translate(
                        text=title,
                        source_language="chinese",
                        target_language="bengali"
                    )

                    if title_bn_result["success"]:
                        translations["title_bn"] = title_bn_result["translated_text"]
                        logger.debug(f"Title translated to Bengali: {translations['title_bn'][:50]}...")
                    else:
                        logger.warning(f"Failed to translate title to Bengali: {title_bn_result.get('error')}")

                # Translate title to English
                if title:
                    logger.debug(f"Translating title to English: {title[:50]}...")
                    title_en_result = await local_ai.translate(
                        text=title,
                        source_language="chinese",
                        target_language="english"
                    )

                    if title_en_result["success"]:
                        translations["title_en"] = title_en_result["translated_text"]
                        logger.debug(f"Title translated to English: {translations['title_en'][:50]}...")
                    else:
                        logger.warning(f"Failed to translate title to English: {title_en_result.get('error')}")

                # Translate description to Bengali
                if description:
                    logger.debug(f"Translating description to Bengali: {description[:50]}...")
                    desc_bn_result = await local_ai.translate(
                        text=description,
                        source_language="chinese",
                        target_language="bengali"
                    )

                    if desc_bn_result["success"]:
                        translations["description_bn"] = desc_bn_result["translated_text"]
                        logger.debug(f"Description translated to Bengali: {translations['description_bn'][:50]}...")
                    else:
                        logger.warning(f"Failed to translate description to Bengali: {desc_bn_result.get('error')}")

                # Translate description to English
                if description:
                    logger.debug(f"Translating description to English: {description[:50]}...")
                    desc_en_result = await local_ai.translate(
                        text=description,
                        source_language="chinese",
                        target_language="english"
                    )

                    if desc_en_result["success"]:
                        translations["description_en"] = desc_en_result["translated_text"]
                        logger.debug(f"Description translated to English: {translations['description_en'][:50]}...")
                    else:
                        logger.warning(f"Failed to translate description to English: {desc_en_result.get('error')}")

                # Store translations in a combined format
                # Format: {"bn": "Bengali text", "en": "English text"}
                title_translated = {}
                if translations["title_bn"]:
                    title_translated["bn"] = translations["title_bn"]
                if translations["title_en"]:
                    title_translated["en"] = translations["title_en"]

                description_translated = {}
                if translations["description_bn"]:
                    description_translated["bn"] = translations["description_bn"]
                if translations["description_en"]:
                    description_translated["en"] = translations["description_en"]

                # Update product document with translations
                update_data = {}
                if title_translated:
                    update_data["title_translated"] = title_translated
                if description_translated:
                    update_data["description_translated"] = description_translated

                if not update_data:
                    logger.warning(f"No translations generated for product {product_id}")
                    return False

                # Update product in MongoDB
                success = await ProductModel.update(product_id, update_data)

                if success:
                    logger.info(
                        f"Product {product_id} translated successfully: "
                        f"title_bn={bool(translations['title_bn'])}, "
                        f"title_en={bool(translations['title_en'])}, "
                        f"desc_bn={bool(translations['description_bn'])}, "
                        f"desc_en={bool(translations['description_en'])}"
                    )

                    # Invalidate cache for this product
                    await ProductService.invalidate_product_cache(product_id)

                    return True
                else:
                    logger.error(f"Failed to update product {product_id} with translations")
                    return False

            finally:
                # Close LocalAI client
                await local_ai.close()

        except Exception as e:
            logger.error(f"Error translating product {product_id}: {e}", exc_info=True)
            return False
