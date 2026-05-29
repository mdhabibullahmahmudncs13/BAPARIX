"""
Unit tests for product schemas.

Tests validation, serialization, and deserialization of product-related schemas.
"""

import pytest
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.product import (
    ProductSearchRequest,
    ProductSearchResponse,
    Product,
    PriceRange,
    SupplierInfo,
    PaginationMeta,
    PriceHistoryEntry
)


class TestProductSearchRequest:
    """Test ProductSearchRequest schema validation."""

    def test_valid_search_request_minimal(self):
        """Test valid search request with minimal fields."""
        request = ProductSearchRequest(query="wireless earbuds")
        assert request.query == "wireless earbuds"
        assert request.platforms is None
        assert request.sort_by == "relevance"
        assert request.page == 1
        assert request.page_size == 20

    def test_valid_search_request_full(self):
        """Test valid search request with all fields."""
        request = ProductSearchRequest(
            query="bluetooth speaker",
            platforms=["alibaba", "aliexpress"],
            min_price=100,
            max_price=2000,
            quality_tier="medium",
            shipping_time="7-14 days",
            sort_by="price",
            page=2,
            page_size=30
        )
        assert request.query == "bluetooth speaker"
        assert request.platforms == ["alibaba", "aliexpress"]
        assert request.min_price == 100
        assert request.max_price == 2000
        assert request.quality_tier == "medium"
        assert request.sort_by == "price"
        assert request.page == 2
        assert request.page_size == 30

    def test_empty_query_fails(self):
        """Test that empty query string fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="")
        assert "query" in str(exc_info.value)

    def test_invalid_quality_tier_fails(self):
        """Test that invalid quality tier fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="test", quality_tier="invalid")
        assert "quality_tier" in str(exc_info.value)

    def test_invalid_sort_by_fails(self):
        """Test that invalid sort_by value fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="test", sort_by="invalid")
        assert "sort_by" in str(exc_info.value)

    def test_negative_price_fails(self):
        """Test that negative prices fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="test", min_price=-100)
        assert "min_price" in str(exc_info.value)

    def test_page_size_exceeds_max_fails(self):
        """Test that page_size > 50 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="test", page_size=51)
        assert "page_size" in str(exc_info.value)

    def test_zero_page_fails(self):
        """Test that page=0 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            ProductSearchRequest(query="test", page=0)
        assert "page" in str(exc_info.value)


class TestPriceRange:
    """Test PriceRange schema validation."""

    def test_valid_price_range(self):
        """Test valid price range."""
        price_range = PriceRange(min=100, max=500, currency="BDT")
        assert price_range.min == 100
        assert price_range.max == 500
        assert price_range.currency == "BDT"

    def test_default_currency(self):
        """Test default currency is BDT."""
        price_range = PriceRange(min=100, max=500)
        assert price_range.currency == "BDT"

    def test_negative_price_fails(self):
        """Test that negative prices fail validation."""
        with pytest.raises(ValidationError) as exc_info:
            PriceRange(min=-100, max=500)
        assert "min" in str(exc_info.value)


class TestSupplierInfo:
    """Test SupplierInfo schema validation."""

    def test_valid_supplier_info(self):
        """Test valid supplier information."""
        supplier = SupplierInfo(
            name="Test Supplier",
            rating=4.5,
            years_active=5,
            response_rate=95.0,
            reliability_score=82.0
        )
        assert supplier.name == "Test Supplier"
        assert supplier.rating == 4.5
        assert supplier.years_active == 5
        assert supplier.response_rate == 95.0
        assert supplier.reliability_score == 82.0

    def test_rating_out_of_range_fails(self):
        """Test that rating > 5 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            SupplierInfo(
                name="Test",
                rating=6.0,
                years_active=5,
                response_rate=95.0,
                reliability_score=82.0
            )
        assert "rating" in str(exc_info.value)

    def test_negative_years_active_fails(self):
        """Test that negative years_active fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            SupplierInfo(
                name="Test",
                rating=4.5,
                years_active=-1,
                response_rate=95.0,
                reliability_score=82.0
            )
        assert "years_active" in str(exc_info.value)

    def test_response_rate_over_100_fails(self):
        """Test that response_rate > 100 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            SupplierInfo(
                name="Test",
                rating=4.5,
                years_active=5,
                response_rate=101.0,
                reliability_score=82.0
            )
        assert "response_rate" in str(exc_info.value)


class TestPriceHistoryEntry:
    """Test PriceHistoryEntry schema validation."""

    def test_valid_price_history_entry(self):
        """Test valid price history entry."""
        entry = PriceHistoryEntry(
            date=datetime(2024, 1, 1),
            price=350.0
        )
        assert entry.date == datetime(2024, 1, 1)
        assert entry.price == 350.0

    def test_negative_price_fails(self):
        """Test that negative price fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            PriceHistoryEntry(
                date=datetime(2024, 1, 1),
                price=-100.0
            )
        assert "price" in str(exc_info.value)


class TestProduct:
    """Test Product schema validation."""

    def test_valid_product(self):
        """Test valid product with all required fields."""
        product_id = uuid4()
        now = datetime.utcnow()
        
        product = Product(
            id=product_id,
            title="Wireless Earbuds",
            title_translated="ওয়্যারলেস ইয়ারবাড",
            description="High quality earbuds",
            description_translated="উচ্চ মানের ইয়ারবাড",
            images=["https://example.com/image1.jpg"],
            platform="alibaba",
            price_range=PriceRange(min=300, max=1200),
            quality_tier="medium",
            moq=100,
            supplier_info=SupplierInfo(
                name="Test Supplier",
                rating=4.5,
                years_active=5,
                response_rate=95.0,
                reliability_score=82.0
            ),
            lead_time="7-14 days",
            shipping_options=["air", "sea"],
            category="electronics",
            tags=["bluetooth", "wireless"],
            last_updated=now
        )
        
        assert product.id == product_id
        assert product.title == "Wireless Earbuds"
        assert product.platform == "alibaba"
        assert product.moq == 100
        assert product.is_stale is False

    def test_product_minimal_fields(self):
        """Test product with minimal required fields."""
        product_id = uuid4()
        now = datetime.utcnow()
        
        product = Product(
            id=product_id,
            title="Test Product",
            description="Test description",
            platform="alibaba",
            price_range=PriceRange(min=100, max=500),
            quality_tier="cheap",
            moq=50,
            supplier_info=SupplierInfo(
                name="Supplier",
                rating=4.0,
                years_active=3,
                response_rate=90.0,
                reliability_score=75.0
            ),
            lead_time="10-20 days",
            category="general",
            last_updated=now
        )
        
        assert product.title_translated is None
        assert product.description_translated is None
        assert product.images == []
        assert product.shipping_options == []
        assert product.tags == []

    def test_invalid_quality_tier_fails(self):
        """Test that invalid quality tier fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            Product(
                id=uuid4(),
                title="Test",
                description="Test",
                platform="alibaba",
                price_range=PriceRange(min=100, max=500),
                quality_tier="invalid",
                moq=50,
                supplier_info=SupplierInfo(
                    name="Supplier",
                    rating=4.0,
                    years_active=3,
                    response_rate=90.0,
                    reliability_score=75.0
                ),
                lead_time="10 days",
                category="general",
                last_updated=datetime.utcnow()
            )
        assert "quality_tier" in str(exc_info.value)

    def test_zero_moq_fails(self):
        """Test that MOQ < 1 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            Product(
                id=uuid4(),
                title="Test",
                description="Test",
                platform="alibaba",
                price_range=PriceRange(min=100, max=500),
                quality_tier="medium",
                moq=0,
                supplier_info=SupplierInfo(
                    name="Supplier",
                    rating=4.0,
                    years_active=3,
                    response_rate=90.0,
                    reliability_score=75.0
                ),
                lead_time="10 days",
                category="general",
                last_updated=datetime.utcnow()
            )
        assert "moq" in str(exc_info.value)

    def test_stale_flag_default_false(self):
        """Test that is_stale defaults to False."""
        product = Product(
            id=uuid4(),
            title="Test",
            description="Test",
            platform="alibaba",
            price_range=PriceRange(min=100, max=500),
            quality_tier="medium",
            moq=50,
            supplier_info=SupplierInfo(
                name="Supplier",
                rating=4.0,
                years_active=3,
                response_rate=90.0,
                reliability_score=75.0
            ),
            lead_time="10 days",
            category="general",
            last_updated=datetime.utcnow()
        )
        assert product.is_stale is False

    def test_product_with_specifications(self):
        """Test product with specifications field."""
        product = Product(
            id=uuid4(),
            title="Test",
            description="Test",
            platform="alibaba",
            price_range=PriceRange(min=100, max=500),
            quality_tier="medium",
            moq=50,
            supplier_info=SupplierInfo(
                name="Supplier",
                rating=4.0,
                years_active=3,
                response_rate=90.0,
                reliability_score=75.0
            ),
            lead_time="10 days",
            category="general",
            last_updated=datetime.utcnow(),
            specifications={
                "battery_life": "6 hours",
                "bluetooth_version": "5.0",
                "charging_case": "Yes"
            }
        )
        assert product.specifications is not None
        assert product.specifications["battery_life"] == "6 hours"

    def test_product_with_price_history(self):
        """Test product with price history."""
        product = Product(
            id=uuid4(),
            title="Test",
            description="Test",
            platform="alibaba",
            price_range=PriceRange(min=100, max=500),
            quality_tier="medium",
            moq=50,
            supplier_info=SupplierInfo(
                name="Supplier",
                rating=4.0,
                years_active=3,
                response_rate=90.0,
                reliability_score=75.0
            ),
            lead_time="10 days",
            category="general",
            last_updated=datetime.utcnow(),
            price_history=[
                PriceHistoryEntry(date=datetime(2024, 1, 1), price=350.0),
                PriceHistoryEntry(date=datetime(2024, 1, 15), price=300.0),
            ]
        )
        assert len(product.price_history) == 2
        assert product.price_history[0].price == 350.0
        assert product.price_history[1].price == 300.0

    def test_product_with_similar_products(self):
        """Test product with similar products."""
        similar_id1 = uuid4()
        similar_id2 = uuid4()
        
        product = Product(
            id=uuid4(),
            title="Test",
            description="Test",
            platform="alibaba",
            price_range=PriceRange(min=100, max=500),
            quality_tier="medium",
            moq=50,
            supplier_info=SupplierInfo(
                name="Supplier",
                rating=4.0,
                years_active=3,
                response_rate=90.0,
                reliability_score=75.0
            ),
            lead_time="10 days",
            category="general",
            last_updated=datetime.utcnow(),
            similar_products=[similar_id1, similar_id2]
        )
        assert len(product.similar_products) == 2
        assert product.similar_products[0] == similar_id1
        assert product.similar_products[1] == similar_id2


class TestPaginationMeta:
    """Test PaginationMeta schema validation."""

    def test_valid_pagination_meta(self):
        """Test valid pagination metadata."""
        meta = PaginationMeta(
            page=1,
            page_size=20,
            total=156,
            has_more=True
        )
        assert meta.page == 1
        assert meta.page_size == 20
        assert meta.total == 156
        assert meta.has_more is True

    def test_zero_page_fails(self):
        """Test that page=0 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            PaginationMeta(page=0, page_size=20, total=100, has_more=True)
        assert "page" in str(exc_info.value)

    def test_page_size_exceeds_max_fails(self):
        """Test that page_size > 50 fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            PaginationMeta(page=1, page_size=51, total=100, has_more=True)
        assert "page_size" in str(exc_info.value)

    def test_negative_total_fails(self):
        """Test that negative total fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            PaginationMeta(page=1, page_size=20, total=-1, has_more=False)
        assert "total" in str(exc_info.value)


class TestProductSearchResponse:
    """Test ProductSearchResponse schema validation."""

    def test_valid_search_response(self):
        """Test valid search response with products."""
        product_id = uuid4()
        now = datetime.utcnow()
        
        response = ProductSearchResponse(
            success=True,
            data=[
                Product(
                    id=product_id,
                    title="Test Product",
                    description="Test description",
                    platform="alibaba",
                    price_range=PriceRange(min=100, max=500),
                    quality_tier="medium",
                    moq=50,
                    supplier_info=SupplierInfo(
                        name="Supplier",
                        rating=4.0,
                        years_active=3,
                        response_rate=90.0,
                        reliability_score=75.0
                    ),
                    lead_time="10 days",
                    category="general",
                    last_updated=now
                )
            ],
            meta=PaginationMeta(
                page=1,
                page_size=20,
                total=1,
                has_more=False
            )
        )
        
        assert response.success is True
        assert len(response.data) == 1
        assert response.data[0].id == product_id
        assert response.meta.total == 1

    def test_empty_search_response(self):
        """Test valid search response with no products."""
        response = ProductSearchResponse(
            success=True,
            data=[],
            meta=PaginationMeta(
                page=1,
                page_size=20,
                total=0,
                has_more=False
            )
        )
        
        assert response.success is True
        assert len(response.data) == 0
        assert response.meta.total == 0

    def test_success_defaults_to_true(self):
        """Test that success field defaults to True."""
        response = ProductSearchResponse(
            data=[],
            meta=PaginationMeta(
                page=1,
                page_size=20,
                total=0,
                has_more=False
            )
        )
        assert response.success is True

    def test_serialization_deserialization(self):
        """Test that schema can be serialized and deserialized."""
        product_id = uuid4()
        now = datetime.utcnow()
        
        original = ProductSearchResponse(
            success=True,
            data=[
                Product(
                    id=product_id,
                    title="Test",
                    description="Test",
                    platform="alibaba",
                    price_range=PriceRange(min=100, max=500),
                    quality_tier="medium",
                    moq=50,
                    supplier_info=SupplierInfo(
                        name="Supplier",
                        rating=4.0,
                        years_active=3,
                        response_rate=90.0,
                        reliability_score=75.0
                    ),
                    lead_time="10 days",
                    category="general",
                    last_updated=now
                )
            ],
            meta=PaginationMeta(page=1, page_size=20, total=1, has_more=False)
        )
        
        # Serialize to dict
        data_dict = original.model_dump()
        
        # Deserialize back
        restored = ProductSearchResponse(**data_dict)
        
        assert restored.success == original.success
        assert len(restored.data) == len(original.data)
        assert restored.data[0].id == original.data[0].id
        assert restored.meta.total == original.meta.total
