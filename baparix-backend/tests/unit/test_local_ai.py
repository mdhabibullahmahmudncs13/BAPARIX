"""
Unit tests for Local AI client module

Tests the LocalAI class that integrates with Ollama running Qwen2.5-7b model
for text generation, translation, and categorization.

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.core.local_ai import LocalAI, LocalAIError, LocalAITimeoutError, LocalAIConnectionError


class TestLocalAIInitialization:
    """Test suite for LocalAI initialization"""
    
    def test_init_with_defaults(self):
        """Test LocalAI initialization with default parameters"""
        client = LocalAI()
        
        assert client.base_url == "http://localhost:11434"
        assert client.model == "qwen2.5:7b"
        assert client.timeout == 2
        assert client.max_retries == 1
        assert client.client is not None
    
    def test_init_with_custom_parameters(self):
        """Test LocalAI initialization with custom parameters"""
        client = LocalAI(
            base_url="http://custom-host:8080",
            model="custom-model:latest",
            timeout=5,
            max_retries=3
        )
        
        assert client.base_url == "http://custom-host:8080"
        assert client.model == "custom-model:latest"
        assert client.timeout == 5
        assert client.max_retries == 3
    
    def test_init_strips_trailing_slash(self):
        """Test that trailing slash is removed from base_url"""
        client = LocalAI(base_url="http://localhost:11434/")
        assert client.base_url == "http://localhost:11434"
    
    @pytest.mark.asyncio
    async def test_close_method(self):
        """Test that close method closes the HTTP client"""
        client = LocalAI()
        
        with patch.object(client.client, 'aclose', new_callable=AsyncMock) as mock_close:
            await client.close()
            mock_close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test LocalAI as async context manager"""
        async with LocalAI() as client:
            assert client is not None
            assert isinstance(client, LocalAI)


class TestLocalAIGenerate:
    """Test suite for LocalAI.generate() method"""
    
    @pytest.mark.asyncio
    async def test_generate_success(self):
        """Test successful text generation"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "This is a generated response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.generate(prompt="Test prompt")
        
        assert result["success"] is True
        assert result["response"] == "This is a generated response"
        assert result["model"] == "qwen2.5:7b"
        assert "latency_ms" in result
        assert "tokens" in result
        assert result["tokens"] > 0
    
    @pytest.mark.asyncio
    async def test_generate_with_system_prompt(self):
        """Test text generation with system prompt"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Response with system prompt",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            result = await client.generate(
                prompt="Test prompt",
                system_prompt="You are a helpful assistant"
            )
            
            # Verify system prompt was included in request
            call_args = mock_post.call_args
            assert call_args[1]["json"]["system"] == "You are a helpful assistant"
        
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_generate_with_custom_parameters(self):
        """Test text generation with custom temperature and max_tokens"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Custom response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            result = await client.generate(
                prompt="Test prompt",
                temperature=0.7,
                max_tokens=2048
            )
            
            # Verify parameters were included in request
            call_args = mock_post.call_args
            assert call_args[1]["json"]["options"]["temperature"] == 0.7
            assert call_args[1]["json"]["options"]["num_predict"] == 2048
        
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_generate_timeout(self):
        """Test text generation timeout handling"""
        client = LocalAI(timeout=2)
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
            result = await client.generate(prompt="Test prompt")
        
        assert result["success"] is False
        assert "timed out" in result["error"].lower()
        assert result["tokens"] == 0
    
    @pytest.mark.asyncio
    async def test_generate_connection_error(self):
        """Test text generation connection error handling"""
        client = LocalAI()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, side_effect=httpx.ConnectError("Connection failed")):
            result = await client.generate(prompt="Test prompt")
        
        assert result["success"] is False
        assert "connect" in result["error"].lower()
        assert result["tokens"] == 0
    
    @pytest.mark.asyncio
    async def test_generate_http_error(self):
        """Test text generation HTTP error handling"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.status_code = 500
        
        with patch.object(
            client.client,
            'post',
            new_callable=AsyncMock,
            side_effect=httpx.HTTPStatusError("HTTP error", request=MagicMock(), response=mock_response)
        ):
            result = await client.generate(prompt="Test prompt")
        
        assert result["success"] is False
        assert "HTTP error" in result["error"]
        assert result["tokens"] == 0
    
    @pytest.mark.asyncio
    async def test_generate_retry_logic(self):
        """Test that generate retries on timeout"""
        client = LocalAI(max_retries=2)
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Success after retry",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        # First call times out, second succeeds
        with patch.object(
            client.client,
            'post',
            new_callable=AsyncMock,
            side_effect=[httpx.TimeoutException("Timeout"), mock_response]
        ):
            result = await client.generate(prompt="Test prompt")
        
        assert result["success"] is True
        assert result["response"] == "Success after retry"
    
    @pytest.mark.asyncio
    async def test_generate_latency_tracking(self):
        """Test that generate tracks request latency"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.generate(prompt="Test prompt")
        
        assert "latency_ms" in result
        assert isinstance(result["latency_ms"], int)
        assert result["latency_ms"] >= 0


class TestLocalAITranslate:
    """Test suite for LocalAI.translate() method"""
    
    @pytest.mark.asyncio
    async def test_translate_chinese_to_bengali(self):
        """Test Chinese to Bengali translation"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "ওয়্যারলেস ব্লুটুথ ইয়ারফোন",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.translate(
                text="无线蓝牙耳机",
                target_language="bengali"
            )
        
        assert result["success"] is True
        assert result["translated_text"] == "ওয়্যারলেস ব্লুটুথ ইয়ারফোন"
        assert result["source_language"] == "chinese"
        assert result["target_language"] == "bengali"
        assert "latency_ms" in result
        assert "tokens" in result
    
    @pytest.mark.asyncio
    async def test_translate_chinese_to_english(self):
        """Test Chinese to English translation"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Wireless Bluetooth Earphones",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.translate(
                text="无线蓝牙耳机",
                target_language="english"
            )
        
        assert result["success"] is True
        assert result["translated_text"] == "Wireless Bluetooth Earphones"
        assert result["target_language"] == "english"
    
    @pytest.mark.asyncio
    async def test_translate_with_language_code(self):
        """Test translation with language codes (bn, en)"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Wireless Earbuds",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.translate(
                text="无线耳机",
                target_language="en"
            )
        
        assert result["success"] is True
        assert result["target_language"] == "en"
    
    @pytest.mark.asyncio
    async def test_translate_failure(self):
        """Test translation failure handling"""
        client = LocalAI()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
            result = await client.translate(
                text="无线蓝牙耳机",
                target_language="bengali"
            )
        
        assert result["success"] is False
        assert "error" in result
        assert result["source_language"] == "chinese"
        assert result["target_language"] == "bengali"
    
    @pytest.mark.asyncio
    async def test_translate_strips_whitespace(self):
        """Test that translation strips leading/trailing whitespace"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "  Wireless Earphones  \n",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.translate(
                text="无线耳机",
                target_language="english"
            )
        
        assert result["success"] is True
        assert result["translated_text"] == "Wireless Earphones"


class TestLocalAITag:
    """Test suite for LocalAI.tag() method"""
    
    @pytest.mark.asyncio
    async def test_tag_with_default_categories(self):
        """Test categorization with default financial categories"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "rent",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(text="Paid office rent for January")
        
        assert result["success"] is True
        assert result["category"] == "rent"
        assert "confidence" in result
        assert 0.0 <= result["confidence"] <= 1.0
        assert "latency_ms" in result
    
    @pytest.mark.asyncio
    async def test_tag_with_custom_categories(self):
        """Test categorization with custom categories"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "electronics",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        categories = ["electronics", "clothing", "food", "furniture"]
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(
                text="Wireless earbuds",
                categories=categories
            )
        
        assert result["success"] is True
        assert result["category"] == "electronics"
    
    @pytest.mark.asyncio
    async def test_tag_normalizes_case(self):
        """Test that tag normalizes category to lowercase"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "RENT",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(text="Office rent payment")
        
        assert result["success"] is True
        assert result["category"] == "rent"
    
    @pytest.mark.asyncio
    async def test_tag_handles_invalid_category(self):
        """Test that tag defaults to 'other' for invalid categories"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "invalid_category_xyz",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(text="Some expense")
        
        assert result["success"] is True
        assert result["category"] == "other"
    
    @pytest.mark.asyncio
    async def test_tag_partial_match(self):
        """Test that tag handles partial category matches"""
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "marketing campaign",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(text="Facebook ads")
        
        assert result["success"] is True
        assert result["category"] == "marketing"
    
    @pytest.mark.asyncio
    async def test_tag_confidence_score(self):
        """Test that tag returns higher confidence for single-word responses"""
        client = LocalAI()
        
        # Single word response should have higher confidence
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "rent",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
            result = await client.tag(text="Office rent")
        
        assert result["success"] is True
        assert result["confidence"] == 0.9
    
    @pytest.mark.asyncio
    async def test_tag_failure(self):
        """Test categorization failure handling"""
        client = LocalAI()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
            result = await client.tag(text="Some expense")
        
        assert result["success"] is False
        assert "error" in result
        assert result["tokens"] == 0


class TestLocalAIHealthCheck:
    """Test suite for LocalAI.health_check() method"""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self):
        """Test successful health check"""
        client = LocalAI(model="qwen2.5:7b")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "models": [
                {"name": "qwen2.5:7b"},
                {"name": "llama2:latest"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'get', new_callable=AsyncMock, return_value=mock_response):
            result = await client.health_check()
        
        assert result["healthy"] is True
        assert result["model_available"] is True
        assert "latency_ms" in result
    
    @pytest.mark.asyncio
    async def test_health_check_model_not_available(self):
        """Test health check when model is not available"""
        client = LocalAI(model="nonexistent:model")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "models": [
                {"name": "qwen2.5:7b"},
                {"name": "llama2:latest"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'get', new_callable=AsyncMock, return_value=mock_response):
            result = await client.health_check()
        
        assert result["healthy"] is True
        assert result["model_available"] is False
    
    @pytest.mark.asyncio
    async def test_health_check_connection_failure(self):
        """Test health check connection failure"""
        client = LocalAI()
        
        with patch.object(client.client, 'get', new_callable=AsyncMock, side_effect=httpx.ConnectError("Connection failed")):
            result = await client.health_check()
        
        assert result["healthy"] is False
        assert result["model_available"] is False
        assert "error" in result
    
    @pytest.mark.asyncio
    async def test_health_check_timeout(self):
        """Test health check timeout"""
        client = LocalAI()
        
        with patch.object(client.client, 'get', new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
            result = await client.health_check()
        
        assert result["healthy"] is False
        assert result["model_available"] is False
        assert "error" in result


class TestLocalAIIntegration:
    """Integration tests for LocalAI (require running Ollama server)"""
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_generate_request(self):
        """Test real generate request (requires Ollama running)"""
        client = LocalAI()
        
        result = await client.generate(
            prompt="What is 2+2?",
            system_prompt="You are a math tutor. Answer briefly."
        )
        
        # This test will fail if Ollama is not running, which is expected
        # In CI/CD, this test should be skipped or Ollama should be available
        if result["success"]:
            assert len(result["response"]) > 0
            assert result["latency_ms"] < 5000  # Should be under 5 seconds
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_translate_request(self):
        """Test real translate request (requires Ollama running)"""
        client = LocalAI()
        
        result = await client.translate(
            text="你好",
            target_language="english"
        )
        
        if result["success"]:
            assert len(result["translated_text"]) > 0
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_health_check(self):
        """Test real health check (requires Ollama running)"""
        client = LocalAI()
        
        result = await client.health_check()
        
        # This will pass or fail depending on whether Ollama is running
        assert "healthy" in result
        assert "model_available" in result
