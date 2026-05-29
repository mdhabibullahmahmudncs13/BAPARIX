"""
Product API Endpoints

This module provides REST API endpoints for product search and management.

Requirements:
- 7.1: Provide /api/v1/products/search endpoint accepting query, platforms, and filters
- 7.2: Search products from multiple platforms
- 7.3: Return results within 2 seconds
- 7.4: Return product data including title, price range, quality tier, MOQ, supplier rating, and images
- 7.5: Support filtering by platform, price range, quality tier, and shipping time
- 7.6: Support sorting by price, rating, and MOQ
- 7.7: Implement pagination with configurable page size up to 50 items
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.product import (
    ProductSearchRequest,
    ProductSearchResponse,
)
from app.services.product_service import ProductService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/search",
    response_model=ProductSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search products across multiple platforms",
    description="""
    Search for products across Alibaba, Pinduoduo, Xianyu, SkyBuyBD, DHgate, and AliExpress.
    
    Supports:
    - Full-text search in Bengali and English
    - Filtering by platform, price range, quality tier
    - Sorting by relevance, price, rating, or MOQ
    - Pagination with configurable page size (max 50 items)
    
    **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
    """,
    responses={
        200: {
            "description": "Search results with pagination metadata",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "title": "Wireless Bluetooth Earbuds",
                                "title_translated": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
                                "description": "High quality TWS earbuds",
                                "description_translated": "উচ্চ মানের TWS ইয়ারবাড",
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
                                "last_updated": "2024-01-15T10:30:00Z",
                                "is_stale": False
                            }
                        ],
                        "meta": {
                            "page": 1,
                            "page_size": 20,
                            "total": 156,
                            "has_more": True
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid request parameters",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Invalid query parameters"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": "An unexpected error occurred"
                        }
                    }
                }
            }
        }
    },
    tags=["Products"]
)
async def search_products(
    query: str = Query(
        ...,
        min_length=1,
        description="Search query string (required)",
        examples=["wireless earbuds"]
    ),
    platforms: Optional[str] = Query(
        None,
        description="Comma-separated list of platforms to search (alibaba, pinduoduo, xianyu, skybuybd, dhgate, aliexpress)",
        examples=["alibaba,aliexpress"]
    ),
    min_price: Optional[float] = Query(
        None,
        ge=0,
        description="Minimum price filter in BDT",
        examples=[100]
    ),
    max_price: Optional[float] = Query(
        None,
        ge=0,
        description="Maximum price filter in BDT",
        examples=[2000]
    ),
    quality_tier: Optional[str] = Query(
        None,
        pattern="^(cheap|medium|high)$",
        description="Quality tier filter (cheap, medium, high)",
        examples=["medium"]
    ),
    shipping_time: Optional[str] = Query(
        None,
        description="Shipping time filter (e.g., '7-14 days')",
        examples=["7-14 days"]
    ),
    sort_by: str = Query(
        "relevance",
        pattern="^(relevance|price|rating|moq)$",
        description="Sort order (relevance, price, rating, moq)",
        examples=["price"]
    ),
    page: int = Query(
        1,
        ge=1,
        description="Page number (starts at 1)",
        examples=[1]
    ),
    page_size: int = Query(
        20,
        ge=1,
        le=50,
        description="Items per page (max 50)",
        examples=[20]
    ),
) -> ProductSearchResponse:
    """
    Search products across multiple platforms with filters and pagination.
    
    This endpoint provides full-text search across Alibaba, Pinduoduo, Xianyu,
    SkyBuyBD, DHgate, and AliExpress with support for Bengali and English queries.
    
    Args:
        query: Search query string (required)
        platforms: Comma-separated list of platforms to filter by
        min_price: Minimum price filter in BDT
        max_price: Maximum price filter in BDT
        quality_tier: Quality tier filter (cheap, medium, high)
        shipping_time: Shipping time filter
        sort_by: Sort order (relevance, price, rating, moq)
        page: Page number (starts at 1)
        page_size: Items per page (max 50)
        
    Returns:
        ProductSearchResponse: Search results with pagination metadata
        
    Raises:
        HTTPException: If validation fails or an error occurs
        
    **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
    """
    try:
        # Parse platforms from comma-separated string
        platforms_list = None
        if platforms:
            platforms_list = [p.strip() for p in platforms.split(",") if p.strip()]
        
        # Validate price range
        if min_price is not None and max_price is not None:
            if min_price > max_price:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "min_price cannot be greater than max_price"
                        }
                    }
                )
        
        # Create search request
        search_request = ProductSearchRequest(
            query=query,
            platforms=platforms_list,
            min_price=min_price,
            max_price=max_price,
            quality_tier=quality_tier,
            shipping_time=shipping_time,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )
        
        # Execute search
        logger.info(
            f"Product search request: query='{query}', platforms={platforms_list}, "
            f"page={page}, page_size={page_size}"
        )
        
        result = await ProductService.search(search_request)
        
        logger.info(
            f"Product search completed: found {len(result.data)} products, "
            f"total={result.meta.total}"
        )
        
        return result
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Product search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred during product search"
                }
            }
        )


@router.get(
    "/{product_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get product details by ID",
    description="""
    Retrieve detailed information about a specific product by its UUID.
    
    Returns full product details including:
    - Basic product information (title, description, images)
    - Pricing and MOQ details
    - Supplier information
    - Shipping and logistics
    - Product specifications
    - Price history tracking
    - Similar product recommendations
    
    **Validates: Requirements 7.4**
    """,
    responses={
        200: {
            "description": "Product details with price history and similar products",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "Wireless Bluetooth Earbuds",
                            "title_translated": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড",
                            "description": "Detailed product description...",
                            "description_translated": "বিস্তারিত পণ্য বিবরণ...",
                            "images": ["url1", "url2", "url3"],
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
                            "specifications": {
                                "battery_life": "6 hours",
                                "bluetooth_version": "5.0",
                                "charging_case": "Yes"
                            },
                            "price_history": [
                                {"date": "2024-01-01T00:00:00Z", "price": 350},
                                {"date": "2024-01-15T00:00:00Z", "price": 300}
                            ],
                            "similar_products": ["uuid1", "uuid2"],
                            "category": "electronics",
                            "tags": ["bluetooth", "wireless", "audio"],
                            "last_updated": "2024-01-15T10:30:00Z"
                        }
                    }
                }
            }
        },
        404: {
            "description": "Product not found",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "NOT_FOUND",
                            "message": "Product not found"
                        }
                    }
                }
            }
        }
    },
    tags=["Products"]
)
async def get_product(product_id: str):
    """
    Get product details by ID.
    
    Returns full product details including price history and similar products.
    
    Args:
        product_id: Product UUID
        
    Returns:
        dict: Product details with price_history and similar_products
        
    Raises:
        HTTPException: If product not found
        
    **Validates: Requirements 7.4**
    """
    try:
        product = await ProductService.get_by_id(product_id)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": f"Product with ID {product_id} not found"
                    }
                }
            )
        
        return {
            "success": True,
            "data": product.model_dump()
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error getting product {product_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred"
                }
            }
        )
