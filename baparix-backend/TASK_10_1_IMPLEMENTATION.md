# Task 10.1 Implementation: Product Data Models

## Overview

Implemented MongoDB product data model for storing and managing scraped product data with proper indexing and helper methods.

## Files Created

### 1. `app/models/product.py`
MongoDB Product document model with comprehensive CRUD operations and search functionality.

**Key Features:**
- Document schema definition matching requirements
- Automatic stale product flagging (7-day threshold)
- Comprehensive indexing strategy
- Search with filters and pagination
- Bulk operations support
- Platform and category queries
- Aggregation queries (count by platform)

**Indexes Created:**
- `category` (ascending)
- `platform` (ascending)
- `price_range.min` (ascending)
- `price_range.max` (ascending)
- `category + platform` (compound index)
- `last_updated` (descending)
- `is_stale` (ascending)
- `quality_tier` (ascending)
- `tags` (ascending)

**Methods Implemented:**
- `create()` - Create single product
- `get_by_id()` - Retrieve product by ID
- `update()` - Update product fields
- `delete()` - Delete product
- `search()` - Search with filters, sorting, pagination
- `mark_stale_products()` - Flag products older than 7 days
- `get_stale_products()` - Retrieve stale products
- `bulk_create()` - Bulk insert products
- `get_by_platform()` - Get products by platform
- `get_by_category()` - Get products by category
- `count_all()` - Count total products
- `count_by_platform()` - Aggregate count by platform
- `create_indexes()` - Create all indexes

### 2. `tests/unit/test_product_model.py`
Comprehensive unit tests covering all ProductModel functionality.

**Test Coverage:**
- Product creation and retrieval
- Update and delete operations
- Stale product flagging
- Search with various filters
- Pagination
- Sorting (price, rating, MOQ)
- Bulk operations
- Platform and category queries
- Aggregation queries
- Index creation

## Document Schema

```python
{
    "_id": UUID (string),
    "title": str,
    "title_translated": str (optional),
    "description": str,
    "description_translated": str (optional),
    "images": List[str],  # URLs to external images
    "platform": str,  # alibaba, pinduoduo, xianyu, etc.
    "price_range": {
        "min": float,
        "max": float,
        "currency": str
    },
    "quality_tier": str,  # cheap, medium, high
    "moq": int,  # Minimum order quantity
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
    "is_stale": bool,  # Auto-calculated based on last_updated
    "created_at": datetime,
    "updated_at": datetime
}
```

## Requirements Satisfied

✅ **Requirement 9.1**: Store scraped product data in Document_Database (MongoDB)
- ProductModel provides create() and bulk_create() methods
- Documents stored with all required fields

✅ **Requirement 9.2**: Index products by category, platform, and price range
- Created 9 indexes including category, platform, price_range.min, price_range.max
- Compound index on category + platform for efficient queries
- Additional indexes on last_updated, is_stale, quality_tier, tags

✅ **Requirement 9.3**: Store product images as URLs referencing external sources
- Images field stores list of URL strings
- No binary data stored in MongoDB

✅ **Requirement 9.4**: Flag products older than 7 days as stale
- Automatic is_stale calculation on create/update
- mark_stale_products() method for batch updates
- get_stale_products() method for retrieval

✅ **Requirement 7.2**: Search products from multiple platforms
- search() method supports platform filtering
- get_by_platform() for platform-specific queries

✅ **Requirement 7.5**: Support filtering by platform, price range, quality tier
- search() method supports all filter types
- Price range filtering on min/max values
- Quality tier exact match filtering

✅ **Requirement 7.6**: Support sorting by price, rating, and MOQ
- search() method supports sort_by parameter
- Sorting options: relevance, price, rating, moq

✅ **Requirement 7.7**: Implement pagination with configurable page size up to 50 items
- search() method supports page and page_size parameters
- Returns total count for pagination UI
- Page size validated (max 50)

✅ **Requirement 8.7**: Store scraping results in Document_Database
- bulk_create() method for efficient batch inserts
- Used by scraping engine to store results

## Integration Points

### 1. MongoDB Connection
Uses `app/db/mongodb.py` for connection management:
- `get_products_collection()` - Get products collection
- Connection pooling and health checks
- Automatic index creation on startup

### 2. Pydantic Schemas
Integrates with `app/schemas/product.py`:
- Product schema for API responses
- ProductSearchRequest for search queries
- PriceRange, SupplierInfo nested schemas

### 3. Scraping Engine
Will be used by scraping tasks:
- `bulk_create()` for batch inserts
- Automatic timestamp and stale flag management

### 4. Product Service
Will be used by `app/services/product_service.py`:
- search() for product search API
- get_by_id() for product details API
- mark_stale_products() for maintenance tasks

## Usage Examples

### Create Product
```python
from app.models.product import ProductModel

product_data = {
    "title": "Wireless Earbuds",
    "description": "High quality TWS earbuds",
    "platform": "alibaba",
    "price_range": {"min": 300, "max": 1200, "currency": "BDT"},
    "quality_tier": "medium",
    "moq": 100,
    "supplier_info": {
        "name": "Shenzhen Electronics",
        "rating": 4.5,
        "years_active": 5,
        "response_rate": 95.0,
        "reliability_score": 82.0
    },
    "lead_time": "7-14 days",
    "shipping_options": ["air", "sea"],
    "category": "electronics",
    "tags": ["bluetooth", "wireless"],
    "images": ["https://example.com/image1.jpg"]
}

product_id = await ProductModel.create(product_data)
```

### Search Products
```python
products, total = await ProductModel.search(
    query="wireless earbuds",
    platforms=["alibaba", "aliexpress"],
    min_price=200,
    max_price=1000,
    quality_tier="medium",
    sort_by="price",
    page=1,
    page_size=20
)
```

### Bulk Insert
```python
products = [product_data1, product_data2, product_data3]
count = await ProductModel.bulk_create(products)
```

### Mark Stale Products
```python
# Run daily to flag old products
count = await ProductModel.mark_stale_products()
print(f"Marked {count} products as stale")
```

## Testing Notes

The unit tests require a running MongoDB instance with proper authentication. Tests cover:
- All CRUD operations
- Search functionality with various filters
- Pagination and sorting
- Stale product management
- Bulk operations
- Aggregation queries
- Index creation

To run tests with MongoDB:
```bash
# Ensure MongoDB is running
docker-compose up -d mongodb

# Run tests
pytest tests/unit/test_product_model.py -v
```

## Performance Considerations

1. **Indexing Strategy**: 9 indexes created for optimal query performance
2. **Connection Pooling**: Uses motor async driver with connection pool (10-20 connections)
3. **Bulk Operations**: bulk_create() for efficient batch inserts
4. **Pagination**: Efficient skip/limit queries with total count
5. **Stale Flagging**: Batch update operation for marking stale products

## Next Steps

1. **Task 10.2**: Implement product translation service using Local AI
2. **Task 10.3**: Create product search API endpoint
3. **Task 10.4**: Integrate with scraping engine for data ingestion
4. **Task 10.5**: Add caching layer for frequently accessed products

## Notes

- Model follows MongoDB best practices for document design
- Automatic timestamp management (created_at, updated_at)
- Stale flag automatically calculated based on last_updated
- UUID used for _id field for consistency with PostgreSQL models
- All methods include comprehensive error handling and logging
- Supports bilingual content (Bengali/English) via translated fields
