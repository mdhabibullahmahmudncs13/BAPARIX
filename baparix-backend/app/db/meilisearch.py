"""
Meilisearch Client

This module provides a client for interacting with Meilisearch search engine.
It handles index creation, document indexing, and search operations with support
for Bengali and English full-text search.

Requirements:
- 9.5: Implement full-text search using Meilisearch for Bengali and English queries
- 34.7: Support full-text search in both Bengali and English
"""

import logging
from typing import Any, Dict, List, Optional

import meilisearch
from meilisearch.errors import MeilisearchApiError, MeilisearchError
from meilisearch.index import Index

from app.config import settings

logger = logging.getLogger(__name__)


class MeilisearchClient:
    """
    Meilisearch client for product search.
    
    This class provides methods for:
    - Creating and configuring search indexes
    - Indexing product documents
    - Performing full-text searches in Bengali and English
    - Managing index settings and synonyms
    """
    
    PRODUCTS_INDEX = "products"
    
    def __init__(self):
        """Initialize Meilisearch client."""
        self.client = meilisearch.Client(
            settings.MEILISEARCH_HOST,
            settings.MEILISEARCH_API_KEY
        )
        self._products_index: Optional[Index] = None
    
    async def initialize(self) -> None:
        """
        Initialize Meilisearch indexes and settings.
        
        This should be called on application startup to ensure
        indexes are created and configured properly.
        
        Requirements:
        - 9.5: Implement full-text search using Meilisearch
        """
        try:
            logger.info("Initializing Meilisearch client...")
            
            # Create products index if it doesn't exist
            await self.create_products_index()
            
            # Configure index settings
            await self.configure_products_index()
            
            logger.info("Meilisearch client initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Meilisearch: {e}", exc_info=True)
            raise
    
    def get_products_index(self) -> Index:
        """
        Get the products index.
        
        Returns:
            Index: Meilisearch products index
        """
        if self._products_index is None:
            self._products_index = self.client.index(self.PRODUCTS_INDEX)
        return self._products_index
    
    async def create_products_index(self) -> None:
        """
        Create the products index if it doesn't exist.
        
        Requirements:
        - 9.3: Create search index for products
        """
        try:
            # Check if index exists
            try:
                self.client.get_index(self.PRODUCTS_INDEX)
                logger.info(f"Products index '{self.PRODUCTS_INDEX}' already exists")
            except MeilisearchApiError as e:
                if e.code == "index_not_found":
                    # Create index with primary key
                    task = self.client.create_index(
                        self.PRODUCTS_INDEX,
                        {"primaryKey": "id"}
                    )
                    logger.info(f"Created products index '{self.PRODUCTS_INDEX}': {task}")
                else:
                    raise
            
            # Store index reference
            self._products_index = self.client.index(self.PRODUCTS_INDEX)
            
        except Exception as e:
            logger.error(f"Error creating products index: {e}", exc_info=True)
            raise
    
    async def configure_products_index(self) -> None:
        """
        Configure the products index settings.
        
        Settings include:
        - Searchable attributes (title, description, category, tags)
        - Filterable attributes (platform, category, quality_tier, price_range)
        - Sortable attributes (price, rating, moq)
        - Ranking rules
        
        Requirements:
        - 9.3: Index products by title, description, category, tags
        - 34.7: Support full-text search in both Bengali and English
        """
        try:
            index = self.get_products_index()
            
            # Configure searchable attributes
            # Order matters - earlier attributes have higher priority
            searchable_attributes = [
                "title",
                "title_translated",
                "description",
                "description_translated",
                "category",
                "tags",
            ]
            
            # Configure filterable attributes
            filterable_attributes = [
                "platform",
                "category",
                "quality_tier",
                "price_range.min",
                "price_range.max",
                "is_stale",
            ]
            
            # Configure sortable attributes
            sortable_attributes = [
                "price_range.min",
                "supplier_info.rating",
                "moq",
                "last_updated",
            ]
            
            # Configure displayed attributes (all by default)
            displayed_attributes = ["*"]
            
            # Configure ranking rules
            # Default Meilisearch ranking rules with custom additions
            ranking_rules = [
                "words",
                "typo",
                "proximity",
                "attribute",
                "sort",
                "exactness",
            ]
            
            # Update settings
            index.update_searchable_attributes(searchable_attributes)
            index.update_filterable_attributes(filterable_attributes)
            index.update_sortable_attributes(sortable_attributes)
            index.update_displayed_attributes(displayed_attributes)
            index.update_ranking_rules(ranking_rules)
            
            logger.info("Configured products index settings")
            
        except Exception as e:
            logger.error(f"Error configuring products index: {e}", exc_info=True)
            raise
    
    async def index_product(self, product: Dict[str, Any]) -> None:
        """
        Index a single product document.
        
        Args:
            product: Product document dictionary
            
        Requirements:
        - 9.3: Index products by title, description, category, tags
        """
        try:
            index = self.get_products_index()
            
            # Prepare document for indexing
            # Convert UUID to string if needed
            doc = product.copy()
            if "id" not in doc and "_id" in doc:
                doc["id"] = str(doc["_id"])
            elif "id" in doc:
                doc["id"] = str(doc["id"])
            
            # Remove MongoDB _id field
            doc.pop("_id", None)
            
            # Convert datetime objects to ISO strings
            for key in ["last_updated", "created_at", "updated_at"]:
                if key in doc and hasattr(doc[key], "isoformat"):
                    doc[key] = doc[key].isoformat()
            
            # Add document to index
            task = index.add_documents([doc])
            logger.debug(f"Indexed product {doc['id']}: {task}")
            
        except Exception as e:
            logger.error(f"Error indexing product: {e}", exc_info=True)
            raise
    
    async def index_products_bulk(self, products: List[Dict[str, Any]]) -> None:
        """
        Index multiple product documents in bulk.
        
        Args:
            products: List of product document dictionaries
            
        Requirements:
        - 9.3: Index products by title, description, category, tags
        """
        try:
            if not products:
                logger.debug("No products to index")
                return
            
            index = self.get_products_index()
            
            # Prepare documents for indexing
            docs = []
            for product in products:
                doc = product.copy()
                
                # Convert UUID to string if needed
                if "id" not in doc and "_id" in doc:
                    doc["id"] = str(doc["_id"])
                elif "id" in doc:
                    doc["id"] = str(doc["id"])
                
                # Remove MongoDB _id field
                doc.pop("_id", None)
                
                # Convert datetime objects to ISO strings
                for key in ["last_updated", "created_at", "updated_at"]:
                    if key in doc and hasattr(doc[key], "isoformat"):
                        doc[key] = doc[key].isoformat()
                
                docs.append(doc)
            
            # Add documents to index in batches
            batch_size = 1000
            for i in range(0, len(docs), batch_size):
                batch = docs[i:i + batch_size]
                task = index.add_documents(batch)
                logger.info(f"Indexed batch of {len(batch)} products: {task}")
            
            logger.info(f"Bulk indexed {len(docs)} products")
            
        except Exception as e:
            logger.error(f"Error bulk indexing products: {e}", exc_info=True)
            raise
    
    async def search_products(
        self,
        query: str,
        filters: Optional[str] = None,
        sort: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Search products using full-text search.
        
        Args:
            query: Search query string (supports Bengali and English)
            filters: Filter expression (e.g., "platform = alibaba AND quality_tier = medium")
            sort: Sort expressions (e.g., ["price_range.min:asc"])
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            dict: Search results with hits, total count, and metadata
            
        Requirements:
        - 9.5: Implement full-text search using Meilisearch for Bengali and English queries
        - 34.7: Support full-text search in both Bengali and English
        """
        try:
            index = self.get_products_index()
            
            # Build search parameters
            search_params = {
                "limit": limit,
                "offset": offset,
            }
            
            if filters:
                search_params["filter"] = filters
            
            if sort:
                search_params["sort"] = sort
            
            # Execute search
            results = index.search(query, search_params)
            
            logger.debug(
                f"Search query='{query}', filters={filters}, "
                f"found {results['estimatedTotalHits']} results"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching products: {e}", exc_info=True)
            raise
    
    async def update_product(self, product_id: str, product: Dict[str, Any]) -> None:
        """
        Update a product document in the index.
        
        Args:
            product_id: Product ID
            product: Updated product document
        """
        try:
            index = self.get_products_index()
            
            # Prepare document
            doc = product.copy()
            doc["id"] = str(product_id)
            doc.pop("_id", None)
            
            # Convert datetime objects to ISO strings
            for key in ["last_updated", "created_at", "updated_at"]:
                if key in doc and hasattr(doc[key], "isoformat"):
                    doc[key] = doc[key].isoformat()
            
            # Update document
            task = index.update_documents([doc])
            logger.debug(f"Updated product {product_id}: {task}")
            
        except Exception as e:
            logger.error(f"Error updating product in index: {e}", exc_info=True)
            raise
    
    async def delete_product(self, product_id: str) -> None:
        """
        Delete a product document from the index.
        
        Args:
            product_id: Product ID
        """
        try:
            index = self.get_products_index()
            task = index.delete_document(str(product_id))
            logger.debug(f"Deleted product {product_id}: {task}")
            
        except Exception as e:
            logger.error(f"Error deleting product from index: {e}", exc_info=True)
            raise
    
    async def delete_all_products(self) -> None:
        """
        Delete all products from the index.
        
        WARNING: This will remove all indexed products!
        """
        try:
            index = self.get_products_index()
            task = index.delete_all_documents()
            logger.warning(f"Deleted all products from index: {task}")
            
        except Exception as e:
            logger.error(f"Error deleting all products: {e}", exc_info=True)
            raise
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the products index.
        
        Returns:
            dict: Index statistics including document count
        """
        try:
            index = self.get_products_index()
            stats = index.get_stats()
            logger.debug(f"Index stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error getting index stats: {e}", exc_info=True)
            raise
    
    async def health_check(self) -> bool:
        """
        Check if Meilisearch is healthy and accessible.
        
        Returns:
            bool: True if healthy, False otherwise
        """
        try:
            health = self.client.health()
            is_healthy = health.get("status") == "available"
            logger.debug(f"Meilisearch health: {health}")
            return is_healthy
            
        except Exception as e:
            logger.error(f"Meilisearch health check failed: {e}", exc_info=True)
            return False


# Global Meilisearch client instance
_meilisearch_client: Optional[MeilisearchClient] = None


def get_meilisearch_client() -> MeilisearchClient:
    """
    Get the global Meilisearch client instance.
    
    Returns:
        MeilisearchClient: Global client instance
    """
    global _meilisearch_client
    
    if _meilisearch_client is None:
        _meilisearch_client = MeilisearchClient()
    
    return _meilisearch_client


async def initialize_meilisearch() -> None:
    """
    Initialize Meilisearch client on application startup.
    
    This should be called in the FastAPI startup event handler.
    """
    client = get_meilisearch_client()
    await client.initialize()


async def close_meilisearch() -> None:
    """
    Close Meilisearch client on application shutdown.
    
    This should be called in the FastAPI shutdown event handler.
    """
    global _meilisearch_client
    
    if _meilisearch_client is not None:
        logger.info("Closing Meilisearch client")
        _meilisearch_client = None
