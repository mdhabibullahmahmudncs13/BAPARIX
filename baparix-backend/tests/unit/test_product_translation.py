"""
Unit tests for Product Translation

Tests the translate_product() function in ProductService that translates
Chinese product titles and descriptions to Bengali and English using LocalAI.

Validates: Requirements 9.7
"""

import pytest
from datetime import datetime
from uuid import uuid4

from app.services.product_service import ProductService


class TestProductTranslation:
    """Test suite for product translation functionality"""
    
    @pytest.fixture
    def sample_chinese_product(self):
        """Sample product with Chinese content"""
        return {
            "_id": str(uuid4()),
            "title": "无线蓝牙耳机",
            "description": "高品质TWS耳机，带降噪功能",
            "images": ["https://example.com/image1.jpg"],
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
        }
    
    @pytest.mark.asyncio
    async def test_translate_product_success(self, mocker, sample_chinese_product):
        """Test successful product translation"""
        product_id = sample_chinese_product["_id"]
        
        # Mock ProductModel.get_by_id
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_chinese_product
        )
        
        # Mock LocalAI translate method
        mock_local_ai = mocker.MagicMock()
        
        # Mock translation results
        async def mock_translate(text, source_language, target_language):
            if target_language in ["bengali", "bn"]:
                if "无线蓝牙耳机" in text:
                    return {
                        "success": True,
                        "translated_text": "ওয়্যারলেস ব্লুটুথ ইয়ারফোন",
                        "source_language": source_language,
                        "target_language": target_language,
                        "model": "qwen2.5:7b",
                        "latency_ms": 500,
                        "tokens": 10
                    }
                else:
                    return {
                        "success": True,
                        "translated_text": "উচ্চ মানের TWS ইয়ারফোন, নয়েজ ক্যান্সেলেশন সহ",
                        "source_language": source_language,
                        "target_language": target_language,
                        "model": "qwen2.5:7b",
                        "latency_ms": 800,
                        "tokens": 20
                    }
            else:  # English
                if "无线蓝牙耳机" in text:
                    return {
                        "success": True,
                        "translated_text": "Wireless Bluetooth Earphones",
                        "source_language": source_language,
                        "target_language": target_language,
                        "model": "qwen2.5:7b",
                        "latency_ms": 450,
                        "tokens": 8
                    }
                else:
                    return {
                        "success": True,
                        "translated_text": "High quality TWS earphones with noise cancellation",
                        "source_language": source_language,
                        "target_language": target_language,
                        "model": "qwen2.5:7b",
                        "latency_ms": 750,
                        "tokens": 18
                    }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate)
        mock_local_ai.close = mocker.AsyncMock()
        
        # Mock LocalAI constructor
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        # Mock ProductModel.update
        mock_update = mocker.patch(
            "app.services.product_service.ProductModel.update",
            return_value=True
        )
        
        # Mock cache invalidation
        mock_invalidate = mocker.patch(
            "app.services.product_service.ProductService.invalidate_product_cache",
            return_value=True
        )
        
        # Execute translation
        result = await ProductService.translate_product(product_id)
        
        # Verify result
        assert result is True
        
        # Verify LocalAI translate was called 4 times (title bn, title en, desc bn, desc en)
        assert mock_local_ai.translate.call_count == 4
        
        # Verify ProductModel.update was called with translations
        mock_update.assert_called_once()
        call_args = mock_update.call_args
        assert call_args[0][0] == product_id
        update_data = call_args[0][1]
        
        assert "title_translated" in update_data
        assert "bn" in update_data["title_translated"]
        assert "en" in update_data["title_translated"]
        assert update_data["title_translated"]["bn"] == "ওয়্যারলেস ব্লুটুথ ইয়ারফোন"
        assert update_data["title_translated"]["en"] == "Wireless Bluetooth Earphones"
        
        assert "description_translated" in update_data
        assert "bn" in update_data["description_translated"]
        assert "en" in update_data["description_translated"]
        
        # Verify cache was invalidated
        mock_invalidate.assert_called_once_with(product_id)
        
        # Verify LocalAI client was closed
        mock_local_ai.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_translate_product_not_found(self, mocker):
        """Test translation when product is not found"""
        product_id = str(uuid4())
        
        # Mock ProductModel.get_by_id to return None
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=None
        )
        
        result = await ProductService.translate_product(product_id)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_translate_product_no_content(self, mocker):
        """Test translation when product has no title or description"""
        product_id = str(uuid4())
        
        # Mock product with no title or description
        empty_product = {
            "_id": product_id,
            "title": "",
            "description": "",
            "platform": "alibaba",
            "price_range": {"min": 100, "max": 200, "currency": "BDT"},
            "quality_tier": "medium",
            "moq": 50,
            "supplier_info": {
                "name": "Test",
                "rating": 4.0,
                "years_active": 3,
                "response_rate": 90.0,
                "reliability_score": 75.0
            },
            "lead_time": "10 days",
            "category": "test",
            "last_updated": datetime.utcnow(),
        }
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=empty_product
        )
        
        result = await ProductService.translate_product(product_id)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_translate_product_partial_translation_failure(self, mocker, sample_chinese_product):
        """Test translation when some translations fail"""
        product_id = sample_chinese_product["_id"]
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_chinese_product
        )
        
        # Mock LocalAI with partial failures
        mock_local_ai = mocker.MagicMock()
        
        call_count = [0]
        
        async def mock_translate(text, source_language, target_language):
            call_count[0] += 1
            # First call (title to Bengali) succeeds
            if call_count[0] == 1:
                return {
                    "success": True,
                    "translated_text": "ওয়্যারলেস ব্লুটুথ ইয়ারফোন",
                    "source_language": source_language,
                    "target_language": target_language,
                    "model": "qwen2.5:7b",
                    "latency_ms": 500,
                    "tokens": 10
                }
            # Second call (title to English) fails
            elif call_count[0] == 2:
                return {
                    "success": False,
                    "error": "Translation timeout",
                    "source_language": source_language,
                    "target_language": target_language,
                    "model": "qwen2.5:7b",
                    "latency_ms": 2000,
                    "tokens": 0
                }
            # Third call (description to Bengali) succeeds
            elif call_count[0] == 3:
                return {
                    "success": True,
                    "translated_text": "উচ্চ মানের TWS ইয়ারফোন",
                    "source_language": source_language,
                    "target_language": target_language,
                    "model": "qwen2.5:7b",
                    "latency_ms": 600,
                    "tokens": 15
                }
            # Fourth call (description to English) succeeds
            else:
                return {
                    "success": True,
                    "translated_text": "High quality TWS earphones",
                    "source_language": source_language,
                    "target_language": target_language,
                    "model": "qwen2.5:7b",
                    "latency_ms": 550,
                    "tokens": 12
                }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate)
        mock_local_ai.close = mocker.AsyncMock()
        
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        mock_update = mocker.patch(
            "app.services.product_service.ProductModel.update",
            return_value=True
        )
        
        mocker.patch(
            "app.services.product_service.ProductService.invalidate_product_cache",
            return_value=True
        )
        
        result = await ProductService.translate_product(product_id)
        
        # Should still succeed with partial translations
        assert result is True
        
        # Verify update was called with partial translations
        call_args = mock_update.call_args
        update_data = call_args[0][1]
        
        # Title should only have Bengali (English failed)
        assert "title_translated" in update_data
        assert "bn" in update_data["title_translated"]
        assert "en" not in update_data["title_translated"]
        
        # Description should have both
        assert "description_translated" in update_data
        assert "bn" in update_data["description_translated"]
        assert "en" in update_data["description_translated"]
    
    @pytest.mark.asyncio
    async def test_translate_product_all_translations_fail(self, mocker, sample_chinese_product):
        """Test translation when all translations fail"""
        product_id = sample_chinese_product["_id"]
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_chinese_product
        )
        
        # Mock LocalAI with all failures
        mock_local_ai = mocker.MagicMock()
        
        async def mock_translate_fail(text, source_language, target_language):
            return {
                "success": False,
                "error": "Translation service unavailable",
                "source_language": source_language,
                "target_language": target_language,
                "model": "qwen2.5:7b",
                "latency_ms": 2000,
                "tokens": 0
            }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate_fail)
        mock_local_ai.close = mocker.AsyncMock()
        
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        result = await ProductService.translate_product(product_id)
        
        # Should fail when no translations succeed
        assert result is False
    
    @pytest.mark.asyncio
    async def test_translate_product_update_failure(self, mocker, sample_chinese_product):
        """Test translation when database update fails"""
        product_id = sample_chinese_product["_id"]
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=sample_chinese_product
        )
        
        # Mock successful translations
        mock_local_ai = mocker.MagicMock()
        
        async def mock_translate(text, source_language, target_language):
            return {
                "success": True,
                "translated_text": "Translated text",
                "source_language": source_language,
                "target_language": target_language,
                "model": "qwen2.5:7b",
                "latency_ms": 500,
                "tokens": 10
            }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate)
        mock_local_ai.close = mocker.AsyncMock()
        
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        # Mock ProductModel.update to fail
        mocker.patch(
            "app.services.product_service.ProductModel.update",
            return_value=False
        )
        
        result = await ProductService.translate_product(product_id)
        
        # Should fail when update fails
        assert result is False
    
    @pytest.mark.asyncio
    async def test_translate_product_exception_handling(self, mocker, sample_chinese_product):
        """Test translation exception handling"""
        product_id = sample_chinese_product["_id"]
        
        # Mock ProductModel.get_by_id to raise exception
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            side_effect=Exception("Database connection error")
        )
        
        result = await ProductService.translate_product(product_id)
        
        # Should return False on exception
        assert result is False
    
    @pytest.mark.asyncio
    async def test_translate_product_only_title(self, mocker):
        """Test translation when product has only title"""
        product_id = str(uuid4())
        
        product_with_title_only = {
            "_id": product_id,
            "title": "无线蓝牙耳机",
            "description": "",
            "platform": "alibaba",
            "price_range": {"min": 100, "max": 200, "currency": "BDT"},
            "quality_tier": "medium",
            "moq": 50,
            "supplier_info": {
                "name": "Test",
                "rating": 4.0,
                "years_active": 3,
                "response_rate": 90.0,
                "reliability_score": 75.0
            },
            "lead_time": "10 days",
            "category": "test",
            "last_updated": datetime.utcnow(),
        }
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=product_with_title_only
        )
        
        mock_local_ai = mocker.MagicMock()
        
        async def mock_translate(text, source_language, target_language):
            return {
                "success": True,
                "translated_text": "Translated title",
                "source_language": source_language,
                "target_language": target_language,
                "model": "qwen2.5:7b",
                "latency_ms": 500,
                "tokens": 10
            }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate)
        mock_local_ai.close = mocker.AsyncMock()
        
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        mock_update = mocker.patch(
            "app.services.product_service.ProductModel.update",
            return_value=True
        )
        
        mocker.patch(
            "app.services.product_service.ProductService.invalidate_product_cache",
            return_value=True
        )
        
        result = await ProductService.translate_product(product_id)
        
        assert result is True
        
        # Should only translate title (2 calls: bn and en)
        assert mock_local_ai.translate.call_count == 2
        
        # Verify update contains only title_translated
        call_args = mock_update.call_args
        update_data = call_args[0][1]
        
        assert "title_translated" in update_data
        assert "description_translated" not in update_data
    
    @pytest.mark.asyncio
    async def test_translate_product_only_description(self, mocker):
        """Test translation when product has only description"""
        product_id = str(uuid4())
        
        product_with_desc_only = {
            "_id": product_id,
            "title": "",
            "description": "高品质TWS耳机",
            "platform": "alibaba",
            "price_range": {"min": 100, "max": 200, "currency": "BDT"},
            "quality_tier": "medium",
            "moq": 50,
            "supplier_info": {
                "name": "Test",
                "rating": 4.0,
                "years_active": 3,
                "response_rate": 90.0,
                "reliability_score": 75.0
            },
            "lead_time": "10 days",
            "category": "test",
            "last_updated": datetime.utcnow(),
        }
        
        mocker.patch(
            "app.services.product_service.ProductModel.get_by_id",
            return_value=product_with_desc_only
        )
        
        mock_local_ai = mocker.MagicMock()
        
        async def mock_translate(text, source_language, target_language):
            return {
                "success": True,
                "translated_text": "Translated description",
                "source_language": source_language,
                "target_language": target_language,
                "model": "qwen2.5:7b",
                "latency_ms": 500,
                "tokens": 10
            }
        
        mock_local_ai.translate = mocker.AsyncMock(side_effect=mock_translate)
        mock_local_ai.close = mocker.AsyncMock()
        
        mocker.patch(
            "app.core.local_ai.LocalAI",
            return_value=mock_local_ai
        )
        
        mock_update = mocker.patch(
            "app.services.product_service.ProductModel.update",
            return_value=True
        )
        
        mocker.patch(
            "app.services.product_service.ProductService.invalidate_product_cache",
            return_value=True
        )
        
        result = await ProductService.translate_product(product_id)
        
        assert result is True
        
        # Should only translate description (2 calls: bn and en)
        assert mock_local_ai.translate.call_count == 2
        
        # Verify update contains only description_translated
        call_args = mock_update.call_args
        update_data = call_args[0][1]
        
        assert "title_translated" not in update_data
        assert "description_translated" in update_data

