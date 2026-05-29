"""
Unit tests for Meilisearch integration.

Tests cover:
- Client initialization
- Index creation and configuration
- Product indexing (single and bulk)
- Product search with filters and sorting
- Product updates and deletions
- Bengali and English full-text search

Requirements:
- 9.3: Create search index for products
- 9.5: Implement full-text search using Meilisearch for Bengali and English queries
- 34.7: Support full-text search in both Bengali and English
"""

import pytest
from datetime import datetime
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from app.db.meilisearch import MeilisearchClient, get_meilisearch_client


@pytest.fixture
def mock_meilisearch_client():
    """Mock Meilisearch client for testing."""
    with patch("app.db.meilisearch.meilisearch.Client") as mock_client:
        # Mock client methods
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        # Mock index
        mock_index = MagicMock()
        mock_instance.index.return_value = mock_index
        mock_instance.get_index.return_value = mock_index
        
        # Mock health check
        mock_instance.health.return_value = {"status": "available"}
        
        yield mock_instance


@pytest.fixture
def sample_product():
    """Sample product document for testing."""
    return {
        "_id": str(uuid4()),
        "title": "Wireless Bluetooth Earbuds",
        "title_translated": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
        "description": "High quality TWS earbuds with noise cancellation",
        "description_translated": "উচ্চ মানের TWS ইয়ারবাড নয়েজ ক্যান্সেলেশন সহ",
        "images": ["https://example.com/image1.jpg"],
        "platform": "alibaba",
        "price_range": {
            "min": 300,
            "max": 1200,
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


class TestMeilisearchClient:
    """Test MeilisearchClient class."""
    
    def test_client_initialization(self, mock_meilisearch_client):
        """Test that client initializes correctly."""
        client = MeilisearchClient()
        
        assert client.client is not None
        assert client.PRODUCTS_INDEX == "products"
    
    @pytest.mark.asyncio
    async def test_create_products_index(self, mock_meilisearch_client):
        """Test creating products index."""
        client = MeilisearchClient()
        
        # Mock index not found error
        from meilisearch.errors import MeilisearchApiError
        
        # Create a proper mock response object
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = '{"message": "Index not found", "code": "index_not_found"}'
        
        error = MeilisearchApiError("", mock_response)
        error.code = "index_not_found"
        mock_meilisearch_client.get_index.side_effect = error
        
        # Mock create_index
        mock_meilisearch_client.create_index.return_value = {"taskUid": 1}
        
        await client.create_products_index()
        
        # Verify create_index was called
        mock_meilisearch_client.create_index.assert_called_once_with(
            "products",
            {"primaryKey": "id"}
        )
    
    @pytest.mark.asyncio
    async def test_configure_products_index(self, mock_meilisearch_client):
        """Test configuring products index settings."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        
        await client.configure_products_index()
        
        # Verify settings were updated
        mock_index.update_searchable_attributes.assert_called_once()
        mock_index.update_filterable_attributes.assert_called_once()
        mock_index.update_sortable_attributes.assert_called_once()
        mock_index.update_displayed_attributes.assert_called_once()
        mock_index.update_ranking_rules.assert_called_once()
        
        # Verify searchable attributes include title, description, category, tags
        searchable_attrs = mock_index.update_searchable_attributes.call_args[0][0]
        assert "title" in searchable_attrs
        assert "title_translated" in searchable_attrs
        assert "description" in searchable_attrs
        assert "description_translated" in searchable_attrs
        assert "category" in searchable_attrs
        assert "tags" in searchable_attrs
    
    @pytest.mark.asyncio
    async def test_index_product(self, mock_meilisearch_client, sample_product):
        """Test indexing a single product."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.add_documents.return_value = {"taskUid": 1}
        
        await client.index_product(sample_product)
        
        # Verify add_documents was called
        mock_index.add_documents.assert_called_once()
        
        # Verify document was prepared correctly
        call_args = mock_index.add_documents.call_args[0][0]
        assert len(call_args) == 1
        doc = call_args[0]
        assert "id" in doc
        assert "_id" not in doc
        assert doc["title"] == sample_product["title"]
    
    @pytest.mark.asyncio
    async def test_index_products_bulk(self, mock_meilisearch_client, sample_product):
        """Test bulk indexing multiple products."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.add_documents.return_value = {"taskUid": 1}
        
        # Create multiple products
        products = [sample_product.copy() for _ in range(5)]
        for i, product in enumerate(products):
            product["_id"] = str(uuid4())
            product["title"] = f"Product {i}"
        
        await client.index_products_bulk(products)
        
        # Verify add_documents was called
        mock_index.add_documents.assert_called_once()
        
        # Verify all products were indexed
        call_args = mock_index.add_documents.call_args[0][0]
        assert len(call_args) == 5
    
    @pytest.mark.asyncio
    async def test_search_products_basic(self, mock_meilisearch_client):
        """Test basic product search."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        
        # Mock search results
        mock_index.search.return_value = {
            "hits": [
                {
                    "id": str(uuid4()),
                    "title": "Wireless Earbuds",
                    "platform": "alibaba",
                    "price_range": {"min": 300, "max": 1200, "currency": "BDT"}
                }
            ],
            "estimatedTotalHits": 1,
            "query": "earbuds"
        }
        
        results = await client.search_products(
            query="earbuds",
            limit=20,
            offset=0
        )
        
        # Verify search was called
        mock_index.search.assert_called_once()
        
        # Verify results
        assert len(results["hits"]) == 1
        assert results["estimatedTotalHits"] == 1
        assert results["hits"][0]["title"] == "Wireless Earbuds"
    
    @pytest.mark.asyncio
    async def test_search_products_with_filters(self, mock_meilisearch_client):
        """Test product search with filters."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.search.return_value = {
            "hits": [],
            "estimatedTotalHits": 0,
            "query": "earbuds"
        }
        
        # Search with filters
        await client.search_products(
            query="earbuds",
            filters="platform = alibaba AND quality_tier = medium",
            limit=20,
            offset=0
        )
        
        # Verify search was called with filters
        call_args = mock_index.search.call_args
        assert call_args[0][0] == "earbuds"
        assert call_args[0][1]["filter"] == "platform = alibaba AND quality_tier = medium"
    
    @pytest.mark.asyncio
    async def test_search_products_with_sort(self, mock_meilisearch_client):
        """Test product search with sorting."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.search.return_value = {
            "hits": [],
            "estimatedTotalHits": 0,
            "query": "earbuds"
        }
        
        # Search with sort
        await client.search_products(
            query="earbuds",
            sort=["price_range.min:asc"],
            limit=20,
            offset=0
        )
        
        # Verify search was called with sort
        call_args = mock_index.search.call_args
        assert call_args[0][1]["sort"] == ["price_range.min:asc"]
    
    @pytest.mark.asyncio
    async def test_search_bengali_query(self, mock_meilisearch_client):
        """Test product search with Bengali query."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        
        # Mock search results with Bengali content
        mock_index.search.return_value = {
            "hits": [
                {
                    "id": str(uuid4()),
                    "title": "Wireless Bluetooth Earbuds",
                    "title_translated": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
                    "platform": "alibaba",
                    "price_range": {"min": 300, "max": 1200, "currency": "BDT"}
                }
            ],
            "estimatedTotalHits": 1,
            "query": "ইয়ারবাড"
        }
        
        results = await client.search_products(
            query="ইয়ারবাড",  # Bengali query
            limit=20,
            offset=0
        )
        
        # Verify search was called with Bengali query
        mock_index.search.assert_called_once()
        call_args = mock_index.search.call_args
        assert call_args[0][0] == "ইয়ারবাড"
        
        # Verify results contain Bengali content
        assert len(results["hits"]) == 1
        assert results["hits"][0]["title_translated"] == "ওয়্যারলেস ব্লুটুথ ইয়ারবাড"
    
    @pytest.mark.asyncio
    async def test_update_product(self, mock_meilisearch_client, sample_product):
        """Test updating a product in the index."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.update_documents.return_value = {"taskUid": 1}
        
        product_id = str(uuid4())
        await client.update_product(product_id, sample_product)
        
        # Verify update_documents was called
        mock_index.update_documents.assert_called_once()
        
        # Verify document was prepared correctly
        call_args = mock_index.update_documents.call_args[0][0]
        assert len(call_args) == 1
        doc = call_args[0]
        assert doc["id"] == product_id
    
    @pytest.mark.asyncio
    async def test_delete_product(self, mock_meilisearch_client):
        """Test deleting a product from the index."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.delete_document.return_value = {"taskUid": 1}
        
        product_id = str(uuid4())
        await client.delete_product(product_id)
        
        # Verify delete_document was called
        mock_index.delete_document.assert_called_once_with(product_id)
    
    @pytest.mark.asyncio
    async def test_health_check_healthy(self, mock_meilisearch_client):
        """Test health check when Meilisearch is healthy."""
        client = MeilisearchClient()
        mock_meilisearch_client.health.return_value = {"status": "available"}
        
        is_healthy = await client.health_check()
        
        assert is_healthy is True
        mock_meilisearch_client.health.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, mock_meilisearch_client):
        """Test health check when Meilisearch is unhealthy."""
        client = MeilisearchClient()
        mock_meilisearch_client.health.return_value = {"status": "unavailable"}
        
        is_healthy = await client.health_check()
        
        assert is_healthy is False
    
    @pytest.mark.asyncio
    async def test_get_index_stats(self, mock_meilisearch_client):
        """Test getting index statistics."""
        client = MeilisearchClient()
        mock_index = mock_meilisearch_client.index.return_value
        mock_index.get_stats.return_value = {
            "numberOfDocuments": 1000,
            "isIndexing": False,
            "fieldDistribution": {}
        }
        
        stats = await client.get_index_stats()
        
        assert stats["numberOfDocuments"] == 1000
        assert stats["isIndexing"] is False
        mock_index.get_stats.assert_called_once()


class TestMeilisearchGlobalClient:
    """Test global Meilisearch client functions."""
    
    def test_get_meilisearch_client_singleton(self):
        """Test that get_meilisearch_client returns singleton instance."""
        with patch("app.db.meilisearch.meilisearch.Client"):
            client1 = get_meilisearch_client()
            client2 = get_meilisearch_client()
            
            assert client1 is client2
