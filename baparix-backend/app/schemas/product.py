"""
Product schemas for VentureOS Backend.

This module defines Pydantic schemas for product search requests, responses,
and product data models. Supports bilingual (Bengali/English) content.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProductSearchRequest(BaseModel):
    """
    Schema for product search requests.
    
    Validates: Requirements 7.1, 7.5, 7.6, 7.7
    """
    query: str = Field(..., min_length=1, description="Search query string")
    platforms: Optional[List[str]] = Field(
        None,
        description="Filter by platforms (alibaba, pinduoduo, xianyu, skybuybd, dhgate, aliexpress)"
    )
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    quality_tier: Optional[str] = Field(
        None,
        pattern="^(cheap|medium|high)$",
        description="Quality tier filter"
    )
    shipping_time: Optional[str] = Field(
        None,
        description="Shipping time filter (e.g., '7-14 days')"
    )
    sort_by: str = Field(
        default="relevance",
        pattern="^(relevance|price|rating|moq)$",
        description="Sort order"
    )
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=50, description="Items per page (max 50)")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "wireless earbuds",
                "platforms": ["alibaba", "aliexpress"],
                "min_price": 100,
                "max_price": 2000,
                "quality_tier": "medium",
                "sort_by": "price",
                "page": 1,
                "page_size": 20
            }
        }


class PriceRange(BaseModel):
    """Price range for a product."""
    min: float = Field(..., ge=0, description="Minimum price")
    max: float = Field(..., ge=0, description="Maximum price")
    currency: str = Field(default="BDT", description="Currency code")

    class Config:
        json_schema_extra = {
            "example": {
                "min": 300,
                "max": 1200,
                "currency": "BDT"
            }
        }


class SupplierInfo(BaseModel):
    """
    Supplier information for a product.
    
    Validates: Requirements 7.4
    """
    name: str = Field(..., description="Supplier name")
    rating: float = Field(..., ge=0, le=5, description="Supplier rating (0-5)")
    years_active: int = Field(..., ge=0, description="Years in business")
    response_rate: float = Field(..., ge=0, le=100, description="Response rate percentage")
    reliability_score: float = Field(..., ge=0, le=100, description="Reliability score (0-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Shenzhen Electronics Co.",
                "rating": 4.5,
                "years_active": 5,
                "response_rate": 95.0,
                "reliability_score": 82.0
            }
        }


class PriceHistoryEntry(BaseModel):
    """
    Price history entry for a product.
    
    Validates: Requirements 7.4
    """
    date: datetime = Field(..., description="Date of price record")
    price: float = Field(..., ge=0, description="Price at this date")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-01T00:00:00Z",
                "price": 350.0
            }
        }


class Product(BaseModel):
    """
    Product schema with all required fields.
    
    Supports bilingual content (Bengali/English) and includes:
    - Basic product information (title, description, images)
    - Pricing and MOQ details
    - Supplier information
    - Shipping and logistics
    - Categorization and tags
    - Price history tracking
    - Similar product recommendations
    - Product specifications
    
    Validates: Requirements 7.4, 9.1, 9.3, 9.7
    """
    id: UUID = Field(..., description="Unique product identifier")
    title: str = Field(..., description="Product title (original language)")
    title_translated: Optional[Dict[str, str]] = Field(None, description="Translated product title (dict with 'bn' and 'en' keys)")
    description: str = Field(..., description="Product description (original language)")
    description_translated: Optional[Dict[str, str]] = Field(None, description="Translated description (dict with 'bn' and 'en' keys)")
    images: List[str] = Field(default_factory=list, description="Product image URLs")
    platform: str = Field(..., description="Source platform (alibaba, pinduoduo, etc.)")
    price_range: PriceRange = Field(..., description="Price range")
    quality_tier: str = Field(..., pattern="^(cheap|medium|high)$", description="Quality tier")
    moq: int = Field(..., ge=1, description="Minimum order quantity")
    supplier_info: SupplierInfo = Field(..., description="Supplier details")
    lead_time: str = Field(..., description="Lead time estimate (e.g., '7-14 days')")
    shipping_options: List[str] = Field(default_factory=list, description="Available shipping methods")
    specifications: Optional[Dict[str, Any]] = Field(None, description="Product specifications (flexible schema)")
    price_history: List[PriceHistoryEntry] = Field(default_factory=list, description="Historical price data")
    similar_products: List[UUID] = Field(default_factory=list, description="UUIDs of similar products")
    category: str = Field(..., description="Product category")
    tags: List[str] = Field(default_factory=list, description="Product tags")
    last_updated: datetime = Field(..., description="Last update timestamp")
    is_stale: bool = Field(default=False, description="Flag for products older than 7 days")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Wireless Bluetooth Earbuds",
                "title_translated": {"bn": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড", "en": "Wireless Bluetooth Earbuds"},
                "description": "High quality TWS earbuds with noise cancellation",
                "description_translated": {"bn": "উচ্চ মানের TWS ইয়ারবাড নয়েজ ক্যান্সেলেশন সহ", "en": "High quality TWS earbuds with noise cancellation"},
                "images": [
                    "https://example.com/image1.jpg",
                    "https://example.com/image2.jpg"
                ],
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
                    {"date": "2024-01-01T00:00:00Z", "price": 350.0},
                    {"date": "2024-01-15T00:00:00Z", "price": 300.0}
                ],
                "similar_products": [
                    "660e8400-e29b-41d4-a716-446655440001",
                    "770e8400-e29b-41d4-a716-446655440002"
                ],
                "category": "electronics",
                "tags": ["bluetooth", "wireless", "audio"],
                "last_updated": "2024-01-15T10:30:00Z",
                "is_stale": False
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata for search results."""
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=50, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of results")
    has_more: bool = Field(..., description="Whether more results are available")

    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 20,
                "total": 156,
                "has_more": True
            }
        }


class ProductSearchResponse(BaseModel):
    """
    Schema for product search responses with pagination.
    
    Validates: Requirements 7.1, 7.3, 7.4, 7.7
    """
    success: bool = Field(default=True, description="Request success status")
    data: List[Product] = Field(default_factory=list, description="List of products")
    meta: PaginationMeta = Field(..., description="Pagination metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Wireless Bluetooth Earbuds",
                        "title_translated": {"bn": "ওয়্যারলেস ব্লুটুথ ইয়ারবাড", "en": "Wireless Bluetooth Earbuds"},
                        "description": "High quality TWS earbuds",
                        "description_translated": {"bn": "উচ্চ মানের TWS ইয়ারবাড", "en": "High quality TWS earbuds"},
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
