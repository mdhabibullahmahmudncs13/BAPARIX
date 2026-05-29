"""
Unit tests for Product API endpoints.

Tests the /api/v1/products/search endpoint with various query parameters,
filters, sorting, and pagination options.

Requirements:
- 7.1: Test /api/v1/products/search endpoint with query, platforms, and filters
- 7.5: Test filtering by platform, price range, quality tier
- 7.6: Test sorting by price, rating, and MOQ
- 7.7: Test pagination with configurable page size
"""

import pytest
from datetime import datetime
from uuid import uuid4
from unittest.mock import AsyncMock, patch

from fastapi import status
from httpx import AsyncClient

from app.main import app
from app.schemas.product import (
    Product,
    ProductSearchResponse,
    PaginationMeta,
    PriceRange,
    SupplierInfo,
)


@pytest.fixture
def sample_product():
    """Create a sample product for testing."""
    return Product(
        id=uuid4(),
        title="Wireless Bluetooth Earbuds",
        title_translated="ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
        description="High quality TWS earbuds with noise cancellation",
        description_translated="উচ্চ মানের TWS ইয়ারবাড নয়েজ ক্যান্সেলেশন সহ",
        images=["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        platform="alibaba",
        price_range=PriceRange(min=300, max=1200, currency="BDT"),
        quality_tier="medium",
        moq=100,
        supplier_info=SupplierInfo(
            name="Shenzhen Electronics Co.",
            rating=4.5,
            years_active=5,
            response_rate=95.0,
            reliability_score=82.0,
        ),
        lead_time="7-14 days",
        shipping_options=["air", "sea"],
        specifications={
            "battery_life": "6 hours",
            "bluetooth_version": "5.0",
            "charging_case": "Yes"
        },
        price_history=[],
        similar_products=[],
        category="electronics",
        tags=["bluetooth", "wireless", "audio"],
        last_updated=datetime.now(),
        is_stale=False,
    )


@pytest.fixture
def sample_search_response(sample_product):
    """Create a sample search response for testing."""
    return ProductSearchResponse(
        success=True,
        data=[sample_product],
        meta=PaginationMeta(
            page=1,
            page_size=20,
            total=156,
            has_more=True,
        ),
    )


@pytest.mark.asyncio
class TestProductSearchEndpoint:
    """Test suite for GET /api/v1/products/search endpoint."""
    
    async def test_search_products_basic_query(self, sample_search_response):
        """
        Test basic product search with query parameter.
        
        **Validates: Requirement 7.1**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={"query": "wireless earbuds"},
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert len(data["data"]) == 1
            assert data["data"][0]["title"] == "Wireless Bluetooth Earbuds"
            assert data["meta"]["page"] == 1
            assert data["meta"]["total"] == 156
    
    async def test_search_products_with_platform_filter(self, sample_search_response):
        """
        Test product search with platform filter.
        
        **Validates: Requirement 7.5**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "platforms": "alibaba,aliexpress",
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_with_price_range_filter(self, sample_search_response):
        """
        Test product search with price range filter.
        
        **Validates: Requirement 7.5**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "min_price": 100,
                        "max_price": 2000,
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_with_quality_tier_filter(self, sample_search_response):
        """
        Test product search with quality tier filter.
        
        **Validates: Requirement 7.5**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "quality_tier": "medium",
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_sort_by_price(self, sample_search_response):
        """
        Test product search with price sorting.
        
        **Validates: Requirement 7.6**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "sort_by": "price",
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_sort_by_rating(self, sample_search_response):
        """
        Test product search with rating sorting.
        
        **Validates: Requirement 7.6**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "sort_by": "rating",
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_sort_by_moq(self, sample_search_response):
        """
        Test product search with MOQ sorting.
        
        **Validates: Requirement 7.6**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "sort_by": "moq",
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_with_pagination(self, sample_search_response):
        """
        Test product search with pagination.
        
        **Validates: Requirement 7.7**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "page": 2,
                        "page_size": 30,
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert "meta" in data
            assert "page" in data["meta"]
            assert "page_size" in data["meta"]
            assert "total" in data["meta"]
            assert "has_more" in data["meta"]
    
    async def test_search_products_max_page_size(self, sample_search_response):
        """
        Test product search with maximum page size (50).
        
        **Validates: Requirement 7.7**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "earbuds",
                        "page_size": 50,
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
    
    async def test_search_products_missing_query(self):
        """
        Test product search without query parameter (should fail).
        
        **Validates: Requirement 7.1**
        """
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/v1/products/search")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_search_products_invalid_price_range(self):
        """
        Test product search with invalid price range (min > max).
        
        **Validates: Requirement 7.5**
        """
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/products/search",
                params={
                    "query": "earbuds",
                    "min_price": 2000,
                    "max_price": 100,
                },
            )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"]["success"] is False
        assert "min_price" in data["detail"]["error"]["message"].lower()
    
    async def test_search_products_invalid_quality_tier(self):
        """
        Test product search with invalid quality tier.
        
        **Validates: Requirement 7.5**
        """
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/products/search",
                params={
                    "query": "earbuds",
                    "quality_tier": "invalid",
                },
            )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_search_products_invalid_sort_by(self):
        """
        Test product search with invalid sort_by parameter.
        
        **Validates: Requirement 7.6**
        """
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/products/search",
                params={
                    "query": "earbuds",
                    "sort_by": "invalid",
                },
            )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_search_products_page_size_exceeds_max(self):
        """
        Test product search with page_size exceeding maximum (50).
        
        **Validates: Requirement 7.7**
        """
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/products/search",
                params={
                    "query": "earbuds",
                    "page_size": 100,
                },
            )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    async def test_search_products_combined_filters(self, sample_search_response):
        """
        Test product search with multiple filters combined.
        
        **Validates: Requirements 7.1, 7.5, 7.6, 7.7**
        """
        with patch(
            "app.services.product_service.ProductService.search",
            new_callable=AsyncMock,
            return_value=sample_search_response,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/products/search",
                    params={
                        "query": "wireless earbuds",
                        "platforms": "alibaba,aliexpress",
                        "min_price": 100,
                        "max_price": 2000,
                        "quality_tier": "medium",
                        "sort_by": "price",
                        "page": 1,
                        "page_size": 20,
                    },
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert len(data["data"]) == 1
            assert data["meta"]["page"] == 1
            assert data["meta"]["page_size"] == 20


@pytest.mark.asyncio
class TestGetProductEndpoint:
    """Test suite for GET /api/v1/products/{product_id} endpoint."""
    
    async def test_get_product_by_id(self, sample_product):
        """Test getting a product by ID."""
        with patch(
            "app.services.product_service.ProductService.get_by_id",
            new_callable=AsyncMock,
            return_value=sample_product,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    f"/api/v1/products/{sample_product.id}"
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["data"]["title"] == "Wireless Bluetooth Earbuds"
    
    async def test_get_product_with_price_history_and_similar_products(self):
        """
        Test getting a product with price history and similar products.
        
        **Validates: Requirement 7.4**
        """
        from app.schemas.product import PriceHistoryEntry
        
        product_id = uuid4()
        similar_product_id1 = uuid4()
        similar_product_id2 = uuid4()
        
        product_with_extras = Product(
            id=product_id,
            title="Wireless Bluetooth Earbuds",
            title_translated="ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
            description="High quality TWS earbuds with noise cancellation",
            description_translated="উচ্চ মানের TWS ইয়ারবাড নয়েজ ক্যান্সেলেশন সহ",
            images=["https://example.com/image1.jpg"],
            platform="alibaba",
            price_range=PriceRange(min=300, max=1200, currency="BDT"),
            quality_tier="medium",
            moq=100,
            supplier_info=SupplierInfo(
                name="Shenzhen Electronics Co.",
                rating=4.5,
                years_active=5,
                response_rate=95.0,
                reliability_score=82.0,
            ),
            lead_time="7-14 days",
            shipping_options=["air", "sea"],
            specifications={
                "battery_life": "6 hours",
                "bluetooth_version": "5.0",
                "charging_case": "Yes"
            },
            price_history=[
                PriceHistoryEntry(date=datetime(2024, 1, 1), price=350.0),
                PriceHistoryEntry(date=datetime(2024, 1, 15), price=300.0),
            ],
            similar_products=[similar_product_id1, similar_product_id2],
            category="electronics",
            tags=["bluetooth", "wireless", "audio"],
            last_updated=datetime.now(),
            is_stale=False,
        )
        
        with patch(
            "app.services.product_service.ProductService.get_by_id",
            new_callable=AsyncMock,
            return_value=product_with_extras,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    f"/api/v1/products/{product_id}"
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            
            # Verify basic product data
            assert data["data"]["title"] == "Wireless Bluetooth Earbuds"
            
            # Verify specifications
            assert "specifications" in data["data"]
            assert data["data"]["specifications"]["battery_life"] == "6 hours"
            assert data["data"]["specifications"]["bluetooth_version"] == "5.0"
            
            # Verify price history
            assert "price_history" in data["data"]
            assert len(data["data"]["price_history"]) == 2
            assert data["data"]["price_history"][0]["price"] == 350.0
            assert data["data"]["price_history"][1]["price"] == 300.0
            
            # Verify similar products
            assert "similar_products" in data["data"]
            assert len(data["data"]["similar_products"]) == 2
            assert str(similar_product_id1) in data["data"]["similar_products"]
            assert str(similar_product_id2) in data["data"]["similar_products"]
    
    async def test_get_product_not_found(self):
        """Test getting a non-existent product."""
        with patch(
            "app.services.product_service.ProductService.get_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    f"/api/v1/products/{uuid4()}"
                )
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
            data = response.json()
            # HTTPException wraps the detail in a 'detail' key
            assert data["detail"]["success"] is False
            assert data["detail"]["error"]["code"] == "NOT_FOUND"
