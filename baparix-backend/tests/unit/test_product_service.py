"""
Unit tests for Product Service

Tests the business logic layer for product search and management,
including conversion between MongoDB documents and Pydantic schemas.
"""

import pytest
from datetime import datetime
from uuid import uuid4

from app.services.product_service import ProductService
from app.schemas.product import (
    ProductSearchRequest,
    ProductSearchResponse,
    Product,
)


class TestProductService:
    """Test suite for ProductService"""
    
    @pytest.fixture
    def sample_product_doc(self):
        """Sample MongoDB product document"""
        return {
            "_id": str(uuid4()),
            "title": "Wireless Bluetooth Earbuds",
            "title_translated": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
            "description": "High quality TWS earbuds with noise cancellation",
            "description_translated": "উচ্চ মানের TWS ইয়ারবাড নয়েজ ক্যান্সেলেশন সহ",
            "images": [
                "https://example.com/image1.jpg",
                "https://example.com/image2.jpg"
            ],
            "platform": "alibaba",
            "price_range": {
                "min": 300.0,
                "max": 1200.0,
                "currency": "BDT"
            },
            "quality_tier": "medium",
            "moq": 100,
            "supplier_info": {
                "name": "Shenzhen Electronics Co.",
                "rating": 4.5,
                "years_active": 5,
                "response_rate": 95.0,
                "reliability_score": 82.0
            },
            "lead_time": "7-14 days",
            "shipping_options": ["air", "sea"],
            "category": "electronics",
            "tags": ["bluetooth", "wireless", "audio"],
            "last_updated": datetime.utcnow(),
            "is_stale": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    def test_document_to_schema_conversion(self, sample_product_doc):
        """Test conversion from MongoDB document to Pydantic schema"""
        product = ProductService._document_to_schema(sample_product_doc)
        
        assert isinstance(product, Product)
        assert product.title == sample_product_doc["title"]
        assert product.title_translated == sample_product_doc["title_translated"]
        assert product.platform == sample_product_doc["platform"]
        assert product.price_range.min == sample_product_doc["price_range"]["min"]
        assert product.price_range.max == sample_product_doc["price_range"]["max"]
        assert product.quality_tier == sample_product_doc["quality_tier"]
        assert product.moq == sample_product_doc["moq"]
        assert product.supplier_info.name == sample_product_doc["supplier_info"]["name"]
        assert product.supplier_info.rating == sample_product_doc["supplier_info"]["rating"]
        assert product.category == sample_product_doc["category"]
        assert product.is_stale == sample_product_doc["is_stale"]
    
    def test_document_to_schema_with_missing_optional_fields(self):
        """Test conversion with minimal required fields"""
        minimal_doc = {
            "_id": str(uuid4()),
            "title": "Test Product",
            "description": "Test description",
            "platform": "alibaba",
            "price_range": {
                "min": 100.0,
                "max": 200.0,
                "currency": "BDT"
            },
            "quality_tier": "medium",
            "moq": 50,
            "supplier_info": {
                "name": "Test Supplier",
                "rating": 4.0,
                "years_active": 3,
                "response_rate": 90.0,
                "reliability_score": 75.0
            },
            "lead_time": "10 days",
            "category": "test",
            "last_updated": datetime.utcnow(),
        }
        
        product = ProductService._document_to_schema(minimal_doc)
        
        assert isinstance(product, Product)
        assert product.title == minimal_doc["title"]
        assert product.title_translated is None
        assert product.description_translated is None
        assert product.images == []
        assert product.shipping_options == []
        assert product.tags == []
        assert product.is_stale is False
    
    def test_document_to_schema_with_string_datetime(self):
        """Test conversion when last_updated is a string"""
        doc = {
            "_id": str(uuid4()),
            "title": "Test Product",
            "description": "Test description",
            "platform": "alibaba",
            "price_range": {
                "min": 100.0,
                "max": 200.0,
                "currency": "BDT"
            },
            "quality_tier": "medium",
            "moq": 50,
            "supplier_info": {
                "name": "Test Supplier",
                "rating": 4.0,
                "years_active": 3,
                "response_rate": 90.0,
                "reliability_score": 75.0
            },
            "lead_time": "10 days",
            "category": "test",
            "last_updated": "2024-01-15T10:30:00Z",
        }
        
        product = ProductService._document_to_schema(doc)
        
        assert isinstance(product, Product)
        assert isinstance(product.last_updated, datetime)
    
    @pytest.mark.asyncio
    async def test_search_with_basic_query(self, mocker):
        """Test product search with basic query"""
        # Mock ProductModel.search
        mock_search = mocker.patch(
            "app.services.product_service.ProductModel.search",
            return_value=(
                [
                    {
                        "_id": str(uuid4()),
                        "title": "Product 1",
                        "description": "Description 1",
                        "platform": "alibaba",
                        "price_range": {"min": 100, "max": 200, "currency": "BDT"},
                        "quality_tier": "medium",
                        "moq": 50,
                        "supplier_info": {
                            "name": "Supplier 1",
                            "rating": 4.5,
                            "years_active": 5,
                            "response_rate": 95.0,
                            "reliability_score": 85.0
                        },
                        "lead_time": "7 days",
                        "category": "electronics",
                        "last_updated": datetime.utcnow(),
                    }
                ],
                1  # total count
            )
        )
        
        request = ProductSearchRequest(
            query="wireless earbuds",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        assert isinstance(response, ProductSearchResponse)
        assert response.success is True
        assert len(response.data) == 1
        assert response.meta.page == 1
        assert response.meta.page_size == 20
        assert response.meta.total == 1
        assert response.meta.has_more is False
        
        # Verify ProductModel.search was called with correct parameters
        mock_search.assert_called_once_with(
            query="wireless earbuds",
            platforms=None,
            min_price=None,
            max_price=None,
            quality_tier=None,
            sort_by="relevance",
            page=1,
            page_size=20
        )
    
    @pytest.mark.asyncio
    async def test_search_with_filters(self, mocker):
        """Test product search with filters"""
        mock_search = mocker.patch(
            "app.services.product_service.ProductModel.search",
            return_value=([], 0)
        )
        
        request = ProductSearchRequest(
            query="earbuds",
            platforms=["alibaba", "aliexpress"],
            min_price=100,
            max_price=2000,
            quality_tier="medium",
            sort_by="price",
            page=2,
            page_size=30
        )
        
        response = await ProductService.search(request)
        
        assert response.success is True
        assert len(response.data) == 0
        assert response.meta.page == 2
        assert response.meta.page_size == 30
        assert response.meta.total == 0
        
        # Verify filters were passed correctly
        mock_search.assert_called_once_with(
            query="earbuds",
            platforms=["alibaba", "aliexpress"],
            min_price=100,
            max_price=2000,
            quality_tier="medium",
            sort_by="price",
            page=2,
            page_size=30
        )
    
    @pytest.mark.asyncio
    async def test_search_pagination_has_more(self, mocker):
        """Test pagination metadata when more results are available"""
        # Mock 50 total results, page 1 with 20 items
        mock_docs = [
            {
                "_id": str(uuid4()),
                "title": f"Product {i}",
                "description": f"Description {i}",
                "platform": "alibaba",
                "price_range": {"min": 100, "max": 200, "currency": "BDT"},
                "quality_tier": "medium",
                "moq": 50,
                "supplier_info": {
                    "name": "Supplier",
                    "rating": 4.5,
                    "years_active": 5,
                    "response_rate": 95.0,
                    "reliability_score": 85.0
                },
                "lead_time": "7 days",
                "category": "electronics",
                "last_updated": datetime.utcnow(),
            }
            for i in range(20)
        ]
        
        mocker.patch(
            "app.services.product_service.ProductModel.search",
            return_value=(mock_docs, 50)
        )
        
        request = ProductSearchRequest(
            query="test",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        assert response.success is True
        assert len(response.data) == 20
        assert response.meta.total == 50
        assert response.meta.has_more is True
    
    @pytest.mark.asyncio
    async def test_search_pagination_no_more(self, mocker):
        """Test pagination metadata when no more results are available"""
        mock_docs = [
            {
                "_id": str(uuid4()),
                "title": "Product 1",
                "description": "Description 1",
                "platform": "alibaba",
                "price_range": {"min": 100, "max": 200, "currency": "BDT"},
                "quality_tier": "medium",
                "moq": 50,
                "supplier_info": {
                    "name": "Supplier",
                    "rating": 4.5,
                    "years_active": 5,
                    "response_rate": 95.0,
                    "reliability_score": 85.0
                },
                "lead_time": "7 days",
                "category": "electronics",
                "last_updated": datetime.utcnow(),
            }
        ]
        
        mocker.patch(
            "app.services.product_service.ProductModel.search",
            return_value=(mock_docs, 15)
        )
        
        request = ProductSearchRequest(
            query="test",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        assert response.success is True
        assert response.meta.has_more is False
    
    @pytest.mark.asyncio
    async def test_search_error_handling(self, mocker):
        """Test search error handling"""
        mocker.patch(
            "app.services.product_service.ProductModel.search",
            side_effect=Exception("Database error")
        )
        
        request = ProductSearchRequest(
            query="test",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        # Should return empty results on error
        assert response.success is False
        assert len(response.data) == 0
        assert response.meta.total == 0
    
    @pytest.mark.asyncio
    async def test_get_by_id_success(self, mocker, sample_product_doc):
        """Test getting product by ID"""
        product_id = sample_product_doc["_id"]
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_product_doc
        )
        
        product = await ProductService.get_by_id(product_id)
        
        assert product is not None
        assert isinstance(product, Product)
        assert product.title == sample_product_doc["title"]
    
    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, mocker):
        """Test getting product by ID when not found"""
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=None
        )
        
        product = await ProductService.get_by_id("nonexistent-id")
        
        assert product is None
    
    @pytest.mark.asyncio
    async def test_get_by_platform(self, mocker, sample_product_doc):
        """Test getting products by platform"""
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_platform",
            return_value=[sample_product_doc]
        )
        
        products = await ProductService.get_by_platform("alibaba", limit=10)
        
        assert len(products) == 1
        assert isinstance(products[0], Product)
        assert products[0].platform == "alibaba"
    
    @pytest.mark.asyncio
    async def test_get_by_category(self, mocker, sample_product_doc):
        """Test getting products by category"""
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_category",
            return_value=[sample_product_doc]
        )
        
        products = await ProductService.get_by_category("electronics", limit=10)
        
        assert len(products) == 1
        assert isinstance(products[0], Product)
        assert products[0].category == "electronics"
    
    @pytest.mark.asyncio
    async def test_get_stale_products(self, mocker, sample_product_doc):
        """Test getting stale products"""
        stale_doc = sample_product_doc.copy()
        stale_doc["is_stale"] = True
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_stale_products",
            return_value=[stale_doc]
        )
        
        products = await ProductService.get_stale_products(limit=10)
        
        assert len(products) == 1
        assert isinstance(products[0], Product)
        assert products[0].is_stale is True
    
    @pytest.mark.asyncio
    async def test_count_all(self, mocker):
        """Test counting all products"""
        mocker.patch(
            "app.services.product_service.ProductModel.count_all",
            return_value=150
        )
        
        count = await ProductService.count_all()
        
        assert count == 150
    
    @pytest.mark.asyncio
    async def test_count_by_platform(self, mocker):
        """Test counting products by platform"""
        expected_counts = {
            "alibaba": 50,
            "aliexpress": 30,
            "pinduoduo": 20
        }
        
        mocker.patch(
            "app.services.product_service.ProductModel.count_by_platform",
            return_value=expected_counts
        )
        
        counts = await ProductService.count_by_platform()
        
        assert counts == expected_counts
        assert counts["alibaba"] == 50

    @pytest.mark.asyncio
    async def test_get_by_id_with_cache_hit(self, mocker, sample_product_doc):
        """Test getting product by ID with cache hit"""
        product_id = sample_product_doc["_id"]
        
        # Mock cache_get to return cached data
        cached_product = ProductService._document_to_schema(sample_product_doc)
        mocker.patch(
            "app.services.product_service.cache_get",
            return_value=cached_product.model_dump()
        )
        
        # Mock track_product_access
        mock_track = mocker.patch(
            "app.services.product_service.ProductService.track_product_access",
            return_value=True
        )
        
        # Should not call ProductModel.get_by_id
        mock_get_by_id = mocker.patch(
            "app.services.product_service.ProductModel.get_by_id"
        )
        
        product = await ProductService.get_by_id(product_id)
        
        assert product is not None
        assert isinstance(product, Product)
        assert product.title == sample_product_doc["title"]
        
        # Verify cache was checked
        mock_get_by_id.assert_not_called()
        
        # Verify access was tracked
        mock_track.assert_called_once_with(product_id)
    
    @pytest.mark.asyncio
    async def test_get_by_id_with_cache_miss(self, mocker, sample_product_doc):
        """Test getting product by ID with cache miss"""
        product_id = sample_product_doc["_id"]
        
        # Mock cache_get to return None (cache miss)
        mocker.patch(
            "app.services.product_service.cache_get",
            return_value=None
        )
        
        # Mock ProductModel.get_by_id
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_product_doc
        )
        
        # Mock cache_set
        mock_cache_set = mocker.patch(
            "app.services.product_service.cache_set",
            return_value=True
        )
        
        # Mock track_product_access
        mock_track = mocker.patch(
            "app.services.product_service.ProductService.track_product_access",
            return_value=True
        )
        
        product = await ProductService.get_by_id(product_id)
        
        assert product is not None
        assert isinstance(product, Product)
        assert product.title == sample_product_doc["title"]
        
        # Verify product was cached
        mock_cache_set.assert_called_once()
        call_args = mock_cache_set.call_args
        assert call_args[0][0] == f"product:detail:{product_id}"
        assert call_args[1]["ttl"] == 3600  # 1 hour
        
        # Verify access was tracked
        mock_track.assert_called_once_with(product_id)
    
    @pytest.mark.asyncio
    async def test_search_with_cache_hit(self, mocker):
        """Test product search with cache hit"""
        from app.schemas.product import PaginationMeta
        
        # Mock cache_get to return cached response
        cached_response = ProductSearchResponse(
            success=True,
            data=[],
            meta=PaginationMeta(
                page=1,
                page_size=20,
                total=0,
                has_more=False
            )
        )
        mocker.patch(
            "app.services.product_service.cache_get",
            return_value=cached_response.model_dump()
        )
        
        # Should not call Meilisearch
        mock_meilisearch = mocker.patch(
            "app.services.product_service.get_meilisearch_client"
        )
        
        request = ProductSearchRequest(
            query="test",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        assert isinstance(response, ProductSearchResponse)
        assert response.success is True
        
        # Verify Meilisearch was not called
        mock_meilisearch.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_search_with_cache_miss(self, mocker):
        """Test product search with cache miss"""
        # Mock cache_get to return None (cache miss)
        mocker.patch(
            "app.services.product_service.cache_get",
            return_value=None
        )
        
        # Mock Meilisearch client
        mock_client = mocker.MagicMock()
        mock_client.search_products = mocker.AsyncMock(
            return_value={
                "hits": [],
                "estimatedTotalHits": 0
            }
        )
        mocker.patch(
            "app.services.product_service.get_meilisearch_client",
            return_value=mock_client
        )
        
        # Mock cache_set
        mock_cache_set = mocker.patch(
            "app.services.product_service.cache_set",
            return_value=True
        )
        
        request = ProductSearchRequest(
            query="test",
            page=1,
            page_size=20
        )
        
        response = await ProductService.search(request)
        
        assert isinstance(response, ProductSearchResponse)
        assert response.success is True
        
        # Verify response was cached
        mock_cache_set.assert_called_once()
        call_args = mock_cache_set.call_args
        assert "product:search:" in call_args[0][0]
        assert call_args[1]["ttl"] == 3600  # 1 hour
    
    @pytest.mark.asyncio
    async def test_invalidate_product_cache(self, mocker):
        """Test cache invalidation for a product"""
        product_id = str(uuid4())
        
        mock_cache_delete = mocker.patch(
            "app.services.product_service.cache_delete",
            return_value=True
        )
        
        result = await ProductService.invalidate_product_cache(product_id)
        
        assert result is True
        mock_cache_delete.assert_called_once_with(f"product:detail:{product_id}")
    
    @pytest.mark.asyncio
    async def test_track_product_access(self, mocker):
        """Test tracking product access for popularity"""
        product_id = str(uuid4())
        
        # Mock Redis client
        mock_client = mocker.MagicMock()
        mock_client.zincrby = mocker.AsyncMock(return_value=1)
        mocker.patch(
            "app.db.redis.get_client",
            return_value=mock_client
        )
        
        result = await ProductService.track_product_access(product_id)
        
        assert result is True
        mock_client.zincrby.assert_called_once_with(
            "product:popular",
            1,
            product_id
        )
    
    @pytest.mark.asyncio
    async def test_get_popular_product_ids(self, mocker):
        """Test getting popular product IDs from Redis"""
        popular_ids = [str(uuid4()) for _ in range(5)]
        
        # Mock Redis client
        mock_client = mocker.MagicMock()
        mock_client.zrevrange = mocker.AsyncMock(return_value=popular_ids)
        mocker.patch(
            "app.db.redis.get_client",
            return_value=mock_client
        )
        
        result = await ProductService._get_popular_product_ids(10)
        
        assert len(result) == 5
        assert result == popular_ids
        mock_client.zrevrange.assert_called_once_with("product:popular", 0, 9)
    
    @pytest.mark.asyncio
    async def test_warm_popular_products_cache(self, mocker, sample_product_doc):
        """Test cache warming for popular products"""
        popular_ids = [str(uuid4()) for _ in range(3)]
        
        # Mock _get_popular_product_ids
        mocker.patch(
            "app.services.product_service.ProductService._get_popular_product_ids",
            return_value=popular_ids
        )
        
        # Mock ProductModel.get_by_id
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_product_doc
        )
        
        # Mock cache_set
        mock_cache_set = mocker.patch(
            "app.services.product_service.cache_set",
            return_value=True
        )
        
        result = await ProductService.warm_popular_products_cache(limit=10)
        
        assert result == 3
        assert mock_cache_set.call_count == 3
    
    @pytest.mark.asyncio
    async def test_warm_popular_products_cache_fallback(self, mocker, sample_product_doc):
        """Test cache warming fallback to recent products"""
        # Mock _get_popular_product_ids to return empty list
        mocker.patch(
            "app.services.product_service.ProductService._get_popular_product_ids",
            return_value=[]
        )
        
        # Mock MongoDB collection
        mock_cursor = mocker.MagicMock()
        mock_cursor.to_list = mocker.AsyncMock(
            return_value=[sample_product_doc, sample_product_doc]
        )
        
        mock_collection = mocker.MagicMock()
        mock_collection.find = mocker.MagicMock(return_value=mock_cursor)
        mock_cursor.sort = mocker.MagicMock(return_value=mock_cursor)
        mock_cursor.limit = mocker.MagicMock(return_value=mock_cursor)
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_collection",
            return_value=mock_collection
        )
        
        # Mock ProductModel.get_by_id
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_product_doc
        )
        
        # Mock cache_set
        mock_cache_set = mocker.patch(
            "app.services.product_service.cache_set",
            return_value=True
        )
        
        result = await ProductService.warm_popular_products_cache(limit=10)
        
        assert result == 2
        assert mock_cache_set.call_count == 2
    
    @pytest.mark.asyncio
    async def test_generate_search_cache_key_consistency(self):
        """Test that search cache key generation is consistent"""
        request1 = ProductSearchRequest(
            query="earbuds",
            platforms=["alibaba", "aliexpress"],
            min_price=100,
            max_price=2000,
            quality_tier="medium",
            sort_by="price",
            page=1,
            page_size=20
        )
        
        request2 = ProductSearchRequest(
            query="earbuds",
            platforms=["aliexpress", "alibaba"],  # Different order
            min_price=100,
            max_price=2000,
            quality_tier="medium",
            sort_by="price",
            page=1,
            page_size=20
        )
        
        key1 = ProductService._generate_search_cache_key(request1)
        key2 = ProductService._generate_search_cache_key(request2)
        
        # Keys should be the same despite different platform order
        assert key1 == key2
        assert key1.startswith("product:search:")
    
    @pytest.mark.asyncio
    async def test_generate_search_cache_key_different_params(self):
        """Test that different search params generate different cache keys"""
        request1 = ProductSearchRequest(
            query="earbuds",
            page=1,
            page_size=20
        )
        
        request2 = ProductSearchRequest(
            query="headphones",
            page=1,
            page_size=20
        )
        
        key1 = ProductService._generate_search_cache_key(request1)
        key2 = ProductService._generate_search_cache_key(request2)
        
        # Keys should be different
        assert key1 != key2
