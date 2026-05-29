"""
Unit tests for Product MongoDB model.

Tests cover:
- Product creation and retrieval
- Index creation
- Stale product flagging
- Search functionality
- Bulk operations
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from app.models.product import ProductModel


@pytest.fixture
async def sample_product_data():
    """Sample product data for testing."""
    return {
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
    }


@pytest.fixture
async def cleanup_products():
    """Cleanup products after tests."""
    yield
    # Cleanup: delete all test products
    collection = ProductModel.get_collection()
    await collection.delete_many({})


@pytest.mark.asyncio
class TestProductModel:
    """Test suite for ProductModel."""
    
    async def test_create_product(self, sample_product_data, cleanup_products):
        """Test creating a new product."""
        # Create product
        product_id = await ProductModel.create(sample_product_data)
        
        # Verify product was created
        assert product_id is not None
        
        # Retrieve product
        product = await ProductModel.get_by_id(product_id)
        assert product is not None
        assert product["title"] == sample_product_data["title"]
        assert product["platform"] == sample_product_data["platform"]
        assert product["category"] == sample_product_data["category"]
        assert "created_at" in product
        assert "updated_at" in product
        assert "is_stale" in product
        assert product["is_stale"] is False  # New product should not be stale
    
    async def test_create_product_with_id(self, sample_product_data, cleanup_products):
        """Test creating a product with a specific ID."""
        product_id = str(uuid4())
        sample_product_data["_id"] = product_id
        
        created_id = await ProductModel.create(sample_product_data)
        assert created_id == product_id
        
        product = await ProductModel.get_by_id(product_id)
        assert product is not None
        assert product["_id"] == product_id
    
    async def test_create_product_missing_fields(self, cleanup_products):
        """Test creating a product with missing required fields."""
        incomplete_data = {
            "title": "Test Product",
            "platform": "alibaba"
            # Missing required fields
        }
        
        with pytest.raises(ValueError, match="Missing required fields"):
            await ProductModel.create(incomplete_data)
    
    async def test_get_product_not_found(self, cleanup_products):
        """Test retrieving a non-existent product."""
        product = await ProductModel.get_by_id("non-existent-id")
        assert product is None
    
    async def test_update_product(self, sample_product_data, cleanup_products):
        """Test updating a product."""
        # Create product
        product_id = await ProductModel.create(sample_product_data)
        
        # Update product
        update_data = {
            "title": "Updated Wireless Earbuds",
            "price_range": {
                "min": 250.0,
                "max": 1000.0,
                "currency": "BDT"
            }
        }
        success = await ProductModel.update(product_id, update_data)
        assert success is True
        
        # Verify update
        product = await ProductModel.get_by_id(product_id)
        assert product["title"] == "Updated Wireless Earbuds"
        assert product["price_range"]["min"] == 250.0
        assert "updated_at" in product
    
    async def test_update_product_not_found(self, cleanup_products):
        """Test updating a non-existent product."""
        success = await ProductModel.update("non-existent-id", {"title": "Test"})
        assert success is False
    
    async def test_delete_product(self, sample_product_data, cleanup_products):
        """Test deleting a product."""
        # Create product
        product_id = await ProductModel.create(sample_product_data)
        
        # Delete product
        success = await ProductModel.delete(product_id)
        assert success is True
        
        # Verify deletion
        product = await ProductModel.get_by_id(product_id)
        assert product is None
    
    async def test_delete_product_not_found(self, cleanup_products):
        """Test deleting a non-existent product."""
        success = await ProductModel.delete("non-existent-id")
        assert success is False
    
    async def test_stale_product_flagging(self, sample_product_data, cleanup_products):
        """Test that products older than 7 days are flagged as stale."""
        # Create product with old last_updated timestamp
        old_date = datetime.utcnow() - timedelta(days=10)
        sample_product_data["last_updated"] = old_date
        
        product_id = await ProductModel.create(sample_product_data)
        
        # Verify product is marked as stale
        product = await ProductModel.get_by_id(product_id)
        assert product["is_stale"] is True
    
    async def test_mark_stale_products(self, sample_product_data, cleanup_products):
        """Test marking stale products."""
        # Create fresh product
        fresh_product_data = sample_product_data.copy()
        fresh_product_data["last_updated"] = datetime.utcnow()
        await ProductModel.create(fresh_product_data)
        
        # Create old product
        old_product_data = sample_product_data.copy()
        old_product_data["last_updated"] = datetime.utcnow() - timedelta(days=10)
        old_product_data["is_stale"] = False  # Manually set to False
        old_product_id = await ProductModel.create(old_product_data)
        
        # Mark stale products
        count = await ProductModel.mark_stale_products()
        assert count >= 1
        
        # Verify old product is now marked as stale
        old_product = await ProductModel.get_by_id(old_product_id)
        assert old_product["is_stale"] is True
    
    async def test_get_stale_products(self, sample_product_data, cleanup_products):
        """Test retrieving stale products."""
        # Create stale product
        old_date = datetime.utcnow() - timedelta(days=10)
        sample_product_data["last_updated"] = old_date
        await ProductModel.create(sample_product_data)
        
        # Get stale products
        stale_products = await ProductModel.get_stale_products(limit=10)
        assert len(stale_products) >= 1
        assert all(p["is_stale"] for p in stale_products)
    
    async def test_search_products_by_query(self, sample_product_data, cleanup_products):
        """Test searching products by query string."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Search by title
        products, total = await ProductModel.search(query="Wireless", page=1, page_size=20)
        assert total >= 1
        assert len(products) >= 1
        assert any("Wireless" in p["title"] for p in products)
    
    async def test_search_products_by_platform(self, sample_product_data, cleanup_products):
        """Test searching products by platform."""
        # Create products on different platforms
        alibaba_product = sample_product_data.copy()
        alibaba_product["platform"] = "alibaba"
        await ProductModel.create(alibaba_product)
        
        aliexpress_product = sample_product_data.copy()
        aliexpress_product["platform"] = "aliexpress"
        await ProductModel.create(aliexpress_product)
        
        # Search by platform
        products, total = await ProductModel.search(platforms=["alibaba"], page=1, page_size=20)
        assert total >= 1
        assert all(p["platform"] == "alibaba" for p in products)
    
    async def test_search_products_by_price_range(self, sample_product_data, cleanup_products):
        """Test searching products by price range."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Search by price range
        products, total = await ProductModel.search(
            min_price=200.0,
            max_price=500.0,
            page=1,
            page_size=20
        )
        assert total >= 1
        assert all(p["price_range"]["min"] >= 200.0 for p in products)
    
    async def test_search_products_by_category(self, sample_product_data, cleanup_products):
        """Test searching products by category."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Search by category
        products, total = await ProductModel.search(
            category="electronics",
            page=1,
            page_size=20
        )
        assert total >= 1
        assert all(p["category"] == "electronics" for p in products)
    
    async def test_search_products_by_quality_tier(self, sample_product_data, cleanup_products):
        """Test searching products by quality tier."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Search by quality tier
        products, total = await ProductModel.search(
            quality_tier="medium",
            page=1,
            page_size=20
        )
        assert total >= 1
        assert all(p["quality_tier"] == "medium" for p in products)
    
    async def test_search_products_sorting(self, sample_product_data, cleanup_products):
        """Test searching products with different sort orders."""
        # Create products with different prices
        cheap_product = sample_product_data.copy()
        cheap_product["price_range"] = {"min": 100.0, "max": 200.0, "currency": "BDT"}
        await ProductModel.create(cheap_product)
        
        expensive_product = sample_product_data.copy()
        expensive_product["price_range"] = {"min": 1000.0, "max": 2000.0, "currency": "BDT"}
        await ProductModel.create(expensive_product)
        
        # Search sorted by price
        products, total = await ProductModel.search(
            sort_by="price",
            page=1,
            page_size=20
        )
        assert total >= 2
        # Verify ascending price order
        prices = [p["price_range"]["min"] for p in products]
        assert prices == sorted(prices)
    
    async def test_search_products_pagination(self, sample_product_data, cleanup_products):
        """Test product search pagination."""
        # Create multiple products
        for i in range(5):
            product_data = sample_product_data.copy()
            product_data["title"] = f"Product {i}"
            await ProductModel.create(product_data)
        
        # Get first page
        products_page1, total = await ProductModel.search(page=1, page_size=2)
        assert len(products_page1) == 2
        assert total >= 5
        
        # Get second page
        products_page2, _ = await ProductModel.search(page=2, page_size=2)
        assert len(products_page2) == 2
        
        # Verify different products on different pages
        page1_ids = {p["_id"] for p in products_page1}
        page2_ids = {p["_id"] for p in products_page2}
        assert page1_ids.isdisjoint(page2_ids)
    
    async def test_bulk_create_products(self, sample_product_data, cleanup_products):
        """Test bulk creating multiple products."""
        # Create multiple product data
        products = []
        for i in range(5):
            product_data = sample_product_data.copy()
            product_data["title"] = f"Bulk Product {i}"
            products.append(product_data)
        
        # Bulk create
        count = await ProductModel.bulk_create(products)
        assert count == 5
        
        # Verify products were created
        all_products, total = await ProductModel.search(page=1, page_size=10)
        assert total >= 5
    
    async def test_get_by_platform(self, sample_product_data, cleanup_products):
        """Test getting products by platform."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Get by platform
        products = await ProductModel.get_by_platform("alibaba", limit=10)
        assert len(products) >= 1
        assert all(p["platform"] == "alibaba" for p in products)
    
    async def test_get_by_category(self, sample_product_data, cleanup_products):
        """Test getting products by category."""
        # Create product
        await ProductModel.create(sample_product_data)
        
        # Get by category
        products = await ProductModel.get_by_category("electronics", limit=10)
        assert len(products) >= 1
        assert all(p["category"] == "electronics" for p in products)
    
    async def test_count_all(self, sample_product_data, cleanup_products):
        """Test counting all products."""
        # Create products
        await ProductModel.create(sample_product_data)
        await ProductModel.create(sample_product_data)
        
        # Count all
        count = await ProductModel.count_all()
        assert count >= 2
    
    async def test_count_by_platform(self, sample_product_data, cleanup_products):
        """Test counting products by platform."""
        # Create products on different platforms
        alibaba_product = sample_product_data.copy()
        alibaba_product["platform"] = "alibaba"
        await ProductModel.create(alibaba_product)
        await ProductModel.create(alibaba_product)
        
        aliexpress_product = sample_product_data.copy()
        aliexpress_product["platform"] = "aliexpress"
        await ProductModel.create(aliexpress_product)
        
        # Count by platform
        counts = await ProductModel.count_by_platform()
        assert "alibaba" in counts
        assert counts["alibaba"] >= 2
        assert "aliexpress" in counts
        assert counts["aliexpress"] >= 1
    
    async def test_create_indexes(self, cleanup_products):
        """Test creating indexes for products collection."""
        # Create indexes
        await ProductModel.create_indexes()
        
        # Verify indexes exist
        collection = ProductModel.get_collection()
        indexes = await collection.index_information()
        
        # Check for expected indexes
        assert "idx_category" in indexes
        assert "idx_platform" in indexes
        assert "idx_price_min" in indexes
        assert "idx_price_max" in indexes
        assert "idx_category_platform" in indexes
        assert "idx_last_updated" in indexes
        assert "idx_is_stale" in indexes
