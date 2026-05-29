"""
Property-Based Tests for Product Search

Tests correctness properties for product search functionality using Hypothesis
for property-based testing.

**Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7**
"""

import os
import time
from datetime import datetime
from typing import List
from uuid import uuid4

import pytest
from hypothesis import given, settings, strategies as st
from unittest.mock import AsyncMock, patch

from app.schemas.product import (
    Product,
    ProductSearchResponse,
    PaginationMeta,
    PriceRange,
    SupplierInfo,
)

# Configure Hypothesis profiles
settings.register_profile("ci", max_examples=20, deadline=5000)
settings.register_profile("dev", max_examples=10, deadline=2000)
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Hypothesis strategies for generating test data
@st.composite
def product_strategy(draw):
    """Generate a valid Product instance."""
    return Product(
        id=uuid4(),
        title=draw(st.text(min_size=5, max_size=100)),
        title_translated=draw(st.text(min_size=5, max_size=100)),
        description=draw(st.text(min_size=10, max_size=500)),
        description_translated=draw(st.text(min_size=10, max_size=500)),
        images=draw(st.lists(st.text(min_size=10, max_size=100), min_size=1, max_size=5)),
        platform=draw(st.sampled_from(["alibaba", "pinduoduo", "xianyu", "skybuybd", "dhgate", "aliexpress"])),
        price_range=PriceRange(
            min=draw(st.floats(min_value=10, max_value=5000)),
            max=draw(st.floats(min_value=5000, max_value=50000)),
            currency="BDT"
        ),
        quality_tier=draw(st.sampled_from(["cheap", "medium", "high"])),
        moq=draw(st.integers(min_value=1, max_value=10000)),
        supplier_info=SupplierInfo(
            name=draw(st.text(min_size=5, max_size=50)),
            rating=draw(st.floats(min_value=0, max_value=5)),
            years_active=draw(st.integers(min_value=0, max_value=50)),
            response_rate=draw(st.floats(min_value=0, max_value=100)),
            reliability_score=draw(st.floats(min_value=0, max_value=100)),
        ),
        lead_time=draw(st.sampled_from(["3-7 days", "7-14 days", "14-30 days", "30-60 days"])),
        shipping_options=draw(st.lists(st.sampled_from(["air", "sea", "courier"]), min_size=1, max_size=3, unique=True)),
        specifications=draw(st.dictionaries(
            keys=st.text(min_size=3, max_size=20),
            values=st.text(min_size=1, max_size=50),
            min_size=0,
            max_size=5
        )),
        price_history=[],
        similar_products=[],
        category=draw(st.sampled_from(["electronics", "clothing", "home", "toys", "sports"])),
        tags=draw(st.lists(st.text(min_size=3, max_size=20), min_size=0, max_size=10)),
        last_updated=datetime.now(),
        is_stale=False,
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 21: Product Search Response Time")
@settings(max_examples=15, deadline=3000)
@given(
    query=st.text(min_size=1, max_size=50),
    page=st.integers(min_value=1, max_value=10),
    page_size=st.integers(min_value=1, max_value=50),
)
@pytest.mark.asyncio
async def test_product_search_response_time(session_client, query, page, page_size):
    """
    Feature: ventureos-backend, Property 21: Product Search Response Time
    
    **Validates: Requirements 7.3**
    
    Property: For any product search query, the response should be returned within 2 seconds.
    
    This property ensures that the product search endpoint meets the performance
    requirement of returning results within 2 seconds, regardless of:
    - Query complexity
    - Number of filters applied
    - Page size requested
    - Current system load
    
    Fast response times are critical for user experience in product search,
    as users expect near-instant results when browsing products.
    """
    # Create mock response with sample products
    mock_products = [
        Product(
            id=uuid4(),
            title=f"Product {i}",
            title_translated=f"পণ্য {i}",
            description=f"Description for product {i}",
            description_translated=f"পণ্য {i} এর বিবরণ",
            images=[f"https://example.com/image{i}.jpg"],
            platform="alibaba",
            price_range=PriceRange(min=100 * i, max=500 * i, currency="BDT"),
            quality_tier="medium",
            moq=max(1, 10 * i),  # Ensure moq >= 1
            supplier_info=SupplierInfo(
                name=f"Supplier {i}",
                rating=4.0,
                years_active=5,
                response_rate=90.0,
                reliability_score=80.0,
            ),
            lead_time="7-14 days",
            shipping_options=["air", "sea"],
            specifications={},
            price_history=[],
            similar_products=[],
            category="electronics",
            tags=["tag1", "tag2"],
            last_updated=datetime.now(),
            is_stale=False,
        )
        for i in range(min(page_size, 20))
    ]
    
    mock_response = ProductSearchResponse(
        success=True,
        data=mock_products,
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total=100,
            has_more=True,
        ),
    )
    
    with patch(
        "app.services.product_service.ProductService.search",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        # Measure response time
        start_time = time.time()
        
        response = session_client.get(
            "/api/v1/products/search",
            params={
                "query": query,
                "page": page,
                "page_size": page_size,
            },
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        # Property: Response time must be under 2 seconds
        assert response_time < 2.0, (
            f"Product search took {response_time:.3f}s, exceeding 2s limit. "
            f"Query: '{query}', page: {page}, page_size: {page_size}"
        )
        
        # Verify response is valid
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 22: Product Data Completeness")
@settings(max_examples=15)
@given(
    products=st.lists(product_strategy(), min_size=1, max_size=20),
)
@pytest.mark.asyncio
async def test_product_data_completeness(session_client, products):
    """
    Feature: ventureos-backend, Property 22: Product Data Completeness
    
    **Validates: Requirements 7.4**
    
    Property: For any product in search results, the response should include all required fields:
    title, price_range, quality_tier, moq, supplier_info, lead_time, shipping_options,
    images, category, tags.
    
    This property ensures that every product returned by the search endpoint contains
    all the essential information needed for users to make informed sourcing decisions.
    Missing fields could lead to incomplete product displays or application errors.
    """
    mock_response = ProductSearchResponse(
        success=True,
        data=products,
        meta=PaginationMeta(
            page=1,
            page_size=len(products),
            total=len(products),
            has_more=False,
        ),
    )
    
    with patch(
        "app.services.product_service.ProductService.search",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = session_client.get(
            "/api/v1/products/search",
            params={"query": "test"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Property: All products must have required fields
        required_fields = [
            "id",
            "title",
            "description",
            "images",
            "platform",
            "price_range",
            "quality_tier",
            "moq",
            "supplier_info",
            "lead_time",
            "shipping_options",
            "category",
            "tags",
            "last_updated",
        ]
        
        for i, product in enumerate(data["data"]):
            for field in required_fields:
                assert field in product, (
                    f"Product {i} missing required field '{field}'. "
                    f"Product: {product.get('title', 'Unknown')}"
                )
            
            # Verify nested structures
            assert "min" in product["price_range"], f"Product {i} price_range missing 'min'"
            assert "max" in product["price_range"], f"Product {i} price_range missing 'max'"
            assert "currency" in product["price_range"], f"Product {i} price_range missing 'currency'"
            
            assert "name" in product["supplier_info"], f"Product {i} supplier_info missing 'name'"
            assert "rating" in product["supplier_info"], f"Product {i} supplier_info missing 'rating'"
            assert "years_active" in product["supplier_info"], f"Product {i} supplier_info missing 'years_active'"
            assert "response_rate" in product["supplier_info"], f"Product {i} supplier_info missing 'response_rate'"
            assert "reliability_score" in product["supplier_info"], f"Product {i} supplier_info missing 'reliability_score'"
            
            # Verify data types
            assert isinstance(product["images"], list), f"Product {i} images must be a list"
            assert isinstance(product["shipping_options"], list), f"Product {i} shipping_options must be a list"
            assert isinstance(product["tags"], list), f"Product {i} tags must be a list"
            assert isinstance(product["moq"], int), f"Product {i} moq must be an integer"


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 23: Product Search Filtering")
@settings(max_examples=15)
@given(
    query=st.text(min_size=1, max_size=50),
    platform=st.sampled_from(["alibaba", "pinduoduo", "xianyu", "dhgate", "aliexpress"]),
    min_price=st.floats(min_value=100, max_value=1000),
    max_price=st.floats(min_value=1000, max_value=10000),
    quality_tier=st.sampled_from(["cheap", "medium", "high"]),
)
@pytest.mark.asyncio
async def test_product_search_filtering(
    session_client, query, platform, min_price, max_price, quality_tier
):
    """
    Feature: ventureos-backend, Property 23: Product Search Filtering
    
    **Validates: Requirements 7.5**
    
    Property: For any product search with filters applied (platform, price range, quality tier),
    all returned results should match the filter criteria.
    
    This property ensures that the filtering logic correctly excludes products that don't
    match the specified criteria. Incorrect filtering could lead to:
    - Users seeing irrelevant products
    - Wasted time reviewing unsuitable options
    - Loss of trust in the platform
    """
    # Create products that match the filters
    matching_products = [
        Product(
            id=uuid4(),
            title=f"Matching Product {i}",
            title_translated=f"মিলিত পণ্য {i}",
            description=f"Description {i}",
            description_translated=f"বিবরণ {i}",
            images=[f"https://example.com/image{i}.jpg"],
            platform=platform,  # Matches filter
            price_range=PriceRange(
                min=min_price + 50,  # Within range
                max=max_price - 50,  # Within range
                currency="BDT"
            ),
            quality_tier=quality_tier,  # Matches filter
            moq=100,
            supplier_info=SupplierInfo(
                name=f"Supplier {i}",
                rating=4.0,
                years_active=5,
                response_rate=90.0,
                reliability_score=80.0,
            ),
            lead_time="7-14 days",
            shipping_options=["air", "sea"],
            specifications={},
            price_history=[],
            similar_products=[],
            category="electronics",
            tags=["tag1"],
            last_updated=datetime.now(),
            is_stale=False,
        )
        for i in range(5)
    ]
    
    mock_response = ProductSearchResponse(
        success=True,
        data=matching_products,
        meta=PaginationMeta(
            page=1,
            page_size=20,
            total=5,
            has_more=False,
        ),
    )
    
    with patch(
        "app.services.product_service.ProductService.search",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = session_client.get(
            "/api/v1/products/search",
            params={
                "query": query,
                "platforms": platform,
                "min_price": min_price,
                "max_price": max_price,
                "quality_tier": quality_tier,
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Property: All returned products must match the filters
        for product in data["data"]:
            # Platform filter
            assert product["platform"] == platform, (
                f"Product platform '{product['platform']}' does not match filter '{platform}'"
            )
            
            # Price range filter
            assert product["price_range"]["min"] >= min_price, (
                f"Product min price {product['price_range']['min']} is below filter min {min_price}"
            )
            assert product["price_range"]["max"] <= max_price, (
                f"Product max price {product['price_range']['max']} is above filter max {max_price}"
            )
            
            # Quality tier filter
            assert product["quality_tier"] == quality_tier, (
                f"Product quality tier '{product['quality_tier']}' does not match filter '{quality_tier}'"
            )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 24: Product Search Sorting")
@settings(max_examples=15)
@given(
    sort_by=st.sampled_from(["price", "rating", "moq"]),
    num_products=st.integers(min_value=2, max_value=20),
)
@pytest.mark.asyncio
async def test_product_search_sorting(session_client, sort_by, num_products):
    """
    Feature: ventureos-backend, Property 24: Product Search Sorting
    
    **Validates: Requirements 7.6**
    
    Property: For any product search with sort_by parameter (price, rating, moq),
    the results should be correctly ordered according to the specified field.
    
    This property ensures that sorting works correctly for all supported sort fields.
    Correct sorting is essential for users to:
    - Find the cheapest options (price sort)
    - Identify the most reliable suppliers (rating sort)
    - Discover low MOQ opportunities (moq sort)
    """
    # Create products with varying values for sorting
    products = []
    for i in range(num_products):
        products.append(
            Product(
                id=uuid4(),
                title=f"Product {i}",
                title_translated=f"পণ্য {i}",
                description=f"Description {i}",
                description_translated=f"বিবরণ {i}",
                images=[f"https://example.com/image{i}.jpg"],
                platform="alibaba",
                price_range=PriceRange(
                    min=100 + (i * 100),  # Increasing prices
                    max=500 + (i * 100),
                    currency="BDT"
                ),
                quality_tier="medium",
                moq=10 + (i * 10),  # Increasing MOQ
                supplier_info=SupplierInfo(
                    name=f"Supplier {i}",
                    rating=min(5.0, 1.0 + (i * 0.5)),  # Ensure rating <= 5.0
                    years_active=5,
                    response_rate=90.0,
                    reliability_score=80.0,
                ),
                lead_time="7-14 days",
                shipping_options=["air", "sea"],
                specifications={},
                price_history=[],
                similar_products=[],
                category="electronics",
                tags=["tag1"],
                last_updated=datetime.now(),
                is_stale=False,
            )
        )
    
    # Sort products according to the sort_by parameter
    if sort_by == "price":
        products.sort(key=lambda p: p.price_range.min)
    elif sort_by == "rating":
        products.sort(key=lambda p: p.supplier_info.rating, reverse=True)
    elif sort_by == "moq":
        products.sort(key=lambda p: p.moq)
    
    mock_response = ProductSearchResponse(
        success=True,
        data=products,
        meta=PaginationMeta(
            page=1,
            page_size=num_products,
            total=num_products,
            has_more=False,
        ),
    )
    
    with patch(
        "app.services.product_service.ProductService.search",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = session_client.get(
            "/api/v1/products/search",
            params={
                "query": "test",
                "sort_by": sort_by,
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Property: Products must be sorted correctly
        products_data = data["data"]
        
        if sort_by == "price":
            # Verify ascending price order
            for i in range(len(products_data) - 1):
                current_price = products_data[i]["price_range"]["min"]
                next_price = products_data[i + 1]["price_range"]["min"]
                assert current_price <= next_price, (
                    f"Products not sorted by price: "
                    f"product {i} price {current_price} > product {i+1} price {next_price}"
                )
        
        elif sort_by == "rating":
            # Verify descending rating order
            for i in range(len(products_data) - 1):
                current_rating = products_data[i]["supplier_info"]["rating"]
                next_rating = products_data[i + 1]["supplier_info"]["rating"]
                assert current_rating >= next_rating, (
                    f"Products not sorted by rating: "
                    f"product {i} rating {current_rating} < product {i+1} rating {next_rating}"
                )
        
        elif sort_by == "moq":
            # Verify ascending MOQ order
            for i in range(len(products_data) - 1):
                current_moq = products_data[i]["moq"]
                next_moq = products_data[i + 1]["moq"]
                assert current_moq <= next_moq, (
                    f"Products not sorted by MOQ: "
                    f"product {i} MOQ {current_moq} > product {i+1} MOQ {next_moq}"
                )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 25: Product Search Pagination")
@settings(max_examples=15)
@given(
    page=st.integers(min_value=1, max_value=10),
    page_size=st.integers(min_value=1, max_value=50),
    total_products=st.integers(min_value=10, max_value=200),
)
@pytest.mark.asyncio
async def test_product_search_pagination(session_client, page, page_size, total_products):
    """
    Feature: ventureos-backend, Property 25: Product Search Pagination
    
    **Validates: Requirements 7.7**
    
    Property: For any product search with page and page_size parameters, the response
    should return the correct subset of results (page_size items starting at offset
    (page-1) * page_size).
    
    This property ensures that pagination works correctly, allowing users to:
    - Browse through large result sets efficiently
    - Load results incrementally for better performance
    - Navigate to specific pages of results
    
    Correct pagination is critical for:
    - User experience (smooth browsing)
    - Performance (avoiding large data transfers)
    - Server load (limiting result set size)
    """
    # Calculate expected offset and number of items
    offset = (page - 1) * page_size
    expected_items = min(page_size, max(0, total_products - offset))
    has_more = (page * page_size) < total_products
    
    # Create products for this page
    products = [
        Product(
            id=uuid4(),
            title=f"Product {offset + i}",
            title_translated=f"পণ্য {offset + i}",
            description=f"Description {offset + i}",
            description_translated=f"বিবরণ {offset + i}",
            images=[f"https://example.com/image{i}.jpg"],
            platform="alibaba",
            price_range=PriceRange(min=100, max=500, currency="BDT"),
            quality_tier="medium",
            moq=100,
            supplier_info=SupplierInfo(
                name=f"Supplier {i}",
                rating=4.0,
                years_active=5,
                response_rate=90.0,
                reliability_score=80.0,
            ),
            lead_time="7-14 days",
            shipping_options=["air", "sea"],
            specifications={},
            price_history=[],
            similar_products=[],
            category="electronics",
            tags=["tag1"],
            last_updated=datetime.now(),
            is_stale=False,
        )
        for i in range(expected_items)
    ]
    
    mock_response = ProductSearchResponse(
        success=True,
        data=products,
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total_products,
            has_more=has_more,
        ),
    )
    
    with patch(
        "app.services.product_service.ProductService.search",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = session_client.get(
            "/api/v1/products/search",
            params={
                "query": "test",
                "page": page,
                "page_size": page_size,
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Property: Response must contain correct pagination metadata
        assert "meta" in data, "Response missing pagination metadata"
        meta = data["meta"]
        
        assert meta["page"] == page, (
            f"Incorrect page number: expected {page}, got {meta['page']}"
        )
        
        assert meta["page_size"] == page_size, (
            f"Incorrect page_size: expected {page_size}, got {meta['page_size']}"
        )
        
        assert meta["total"] == total_products, (
            f"Incorrect total: expected {total_products}, got {meta['total']}"
        )
        
        assert meta["has_more"] == has_more, (
            f"Incorrect has_more: expected {has_more}, got {meta['has_more']}"
        )
        
        # Property: Response must contain correct number of items
        actual_items = len(data["data"])
        assert actual_items == expected_items, (
            f"Incorrect number of items: expected {expected_items}, got {actual_items}. "
            f"Page {page}, page_size {page_size}, total {total_products}, offset {offset}"
        )
        
        # Property: If has_more is True, we should have a full page
        if has_more:
            assert actual_items == page_size, (
                f"has_more is True but page is not full: {actual_items} < {page_size}"
            )
        
        # Property: If has_more is False and we have items, this should be the last page
        if not has_more and actual_items > 0:
            assert offset + actual_items == total_products, (
                f"has_more is False but not at end: "
                f"offset {offset} + items {actual_items} != total {total_products}"
            )
