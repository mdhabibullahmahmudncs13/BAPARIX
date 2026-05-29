"""
Unit Tests for Cloud AI Client

Tests the CloudAI class that integrates with OpenRouter API for complex AI tasks.

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.core.cloud_ai import CloudAI, CloudAIError, CloudAITimeoutError, CloudAIConnectionError


@pytest.fixture
def cloud_ai_client():
    """Fixture providing a CloudAI client instance"""
    return CloudAI(
        api_key="test-api-key",
        base_url="https://openrouter.ai/api/v1",
        timeout=30,
        max_retries=3
    )


@pytest.fixture
def mock_httpx_response():
    """Fixture providing a mock httpx response"""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "This is a test response from the AI model."
                }
            }
        ],
        "usage": {
            "total_tokens": 50
        }
    }
    return mock_response


class TestCloudAIInitialization:
    """Test CloudAI client initialization"""
    
    def test_initialization_with_defaults(self):
        """Test that CloudAI initializes with default parameters"""
        client = CloudAI(api_key="test-key")
        
        assert client.api_key == "test-key"
        assert client.base_url == "https://openrouter.ai/api/v1"
        assert client.timeout == 30
        assert client.max_retries == 3
    
    def test_initialization_with_custom_params(self):
        """Test that CloudAI initializes with custom parameters"""
        client = CloudAI(
            api_key="custom-key",
            base_url="https://custom.api.com",
            timeout=60,
            max_retries=5
        )
        
        assert client.api_key == "custom-key"
        assert client.base_url == "https://custom.api.com"
        assert client.timeout == 60
        assert client.max_retries == 5
    
    def test_model_configurations(self):
        """Test that model configurations are properly defined"""
        assert "blueprint" in CloudAI.MODELS
        assert "market_analysis" in CloudAI.MODELS
        assert "seo_strategy" in CloudAI.MODELS
        
        # Verify blueprint model config (Requirement 6.2)
        blueprint_config = CloudAI.MODELS["blueprint"]
        assert blueprint_config["model"] == "meta-llama/llama-3.1-8b-instruct:free"
        assert blueprint_config["max_tokens"] == 4096
        assert blueprint_config["temperature"] == 0.7
        assert blueprint_config["timeout"] == 60
        
        # Verify market analysis model config (Requirement 6.3)
        market_config = CloudAI.MODELS["market_analysis"]
        assert market_config["model"] == "mistralai/mistral-7b-instruct:free"
        assert market_config["max_tokens"] == 2048
        assert market_config["temperature"] == 0.5
        assert market_config["timeout"] == 30
        
        # Verify SEO strategy model config (Requirement 6.4)
        seo_config = CloudAI.MODELS["seo_strategy"]
        assert seo_config["model"] == "google/gemma-2-9b-it:free"
        assert seo_config["max_tokens"] == 2048
        assert seo_config["temperature"] == 0.6
        assert seo_config["timeout"] == 30


class TestCloudAILlamaMethod:
    """Test CloudAI llama method for blueprint generation"""
    
    @pytest.mark.asyncio
    async def test_llama_success(self, cloud_ai_client, mock_httpx_response):
        """Test successful llama generation (Requirement 6.2)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await cloud_ai_client.llama(
                prompt="Generate a business model canvas",
                system_prompt="You are a business consultant."
            )
            
            assert result["success"] is True
            assert "response" in result
            assert result["response"] == "This is a test response from the AI model."
            assert result["model"] == "meta-llama/llama-3.1-8b-instruct:free"
            assert result["tokens"] == 50
            assert "latency_ms" in result
            
            # Verify the API was called correctly
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            assert call_args[0][0] == "/chat/completions"
            
            payload = call_args[1]["json"]
            assert payload["model"] == "meta-llama/llama-3.1-8b-instruct:free"
            assert payload["temperature"] == 0.7
            assert payload["max_tokens"] == 4096
            assert len(payload["messages"]) == 2
            assert payload["messages"][0]["role"] == "system"
            assert payload["messages"][1]["role"] == "user"
    
    @pytest.mark.asyncio
    async def test_llama_with_custom_params(self, cloud_ai_client, mock_httpx_response):
        """Test llama with custom temperature and max_tokens"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await cloud_ai_client.llama(
                prompt="Test prompt",
                temperature=0.9,
                max_tokens=2000
            )
            
            assert result["success"] is True
            
            # Verify custom parameters were used
            payload = mock_post.call_args[1]["json"]
            assert payload["temperature"] == 0.9
            assert payload["max_tokens"] == 2000
    
    @pytest.mark.asyncio
    async def test_llama_without_system_prompt(self, cloud_ai_client, mock_httpx_response):
        """Test llama without system prompt"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await cloud_ai_client.llama(prompt="Test prompt")
            
            assert result["success"] is True
            
            # Verify only user message is present
            payload = mock_post.call_args[1]["json"]
            assert len(payload["messages"]) == 1
            assert payload["messages"][0]["role"] == "user"


class TestCloudAIMistralMethod:
    """Test CloudAI mistral method for market analysis"""
    
    @pytest.mark.asyncio
    async def test_mistral_success(self, cloud_ai_client, mock_httpx_response):
        """Test successful mistral generation (Requirement 6.3)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await cloud_ai_client.mistral(
                prompt="Analyze the wireless earbuds market",
                system_prompt="You are a market analyst."
            )
            
            assert result["success"] is True
            assert result["model"] == "mistralai/mistral-7b-instruct:free"
            assert result["tokens"] == 50
            
            # Verify correct model and parameters
            payload = mock_post.call_args[1]["json"]
            assert payload["model"] == "mistralai/mistral-7b-instruct:free"
            assert payload["temperature"] == 0.5
            assert payload["max_tokens"] == 2048


class TestCloudAIGemmaMethod:
    """Test CloudAI gemma method for SEO strategy"""
    
    @pytest.mark.asyncio
    async def test_gemma_success(self, cloud_ai_client, mock_httpx_response):
        """Test successful gemma generation (Requirement 6.4)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await cloud_ai_client.gemma(
                prompt="Generate SEO keywords for wireless earbuds",
                system_prompt="You are an SEO specialist."
            )
            
            assert result["success"] is True
            assert result["model"] == "google/gemma-2-9b-it:free"
            assert result["tokens"] == 50
            
            # Verify correct model and parameters
            payload = mock_post.call_args[1]["json"]
            assert payload["model"] == "google/gemma-2-9b-it:free"
            assert payload["temperature"] == 0.6
            assert payload["max_tokens"] == 2048


class TestCloudAIRetryLogic:
    """Test CloudAI retry logic with exponential backoff"""
    
    @pytest.mark.asyncio
    async def test_retry_on_timeout(self, cloud_ai_client):
        """Test retry logic on timeout (Requirement 6.5)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            # First 2 attempts timeout, 3rd succeeds
            mock_post.side_effect = [
                httpx.TimeoutException("Timeout"),
                httpx.TimeoutException("Timeout"),
                MagicMock(
                    status_code=200,
                    json=lambda: {
                        "choices": [{"message": {"content": "Success"}}],
                        "usage": {"total_tokens": 10}
                    }
                )
            ]
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is True
            assert result["response"] == "Success"
            assert mock_post.call_count == 3
    
    @pytest.mark.asyncio
    async def test_retry_exhausted(self, cloud_ai_client):
        """Test that retries are exhausted after max_retries attempts (Requirement 6.5)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            # All attempts timeout
            mock_post.side_effect = httpx.TimeoutException("Timeout")
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is False
            assert "All 3 attempts failed" in result["error"]
            assert mock_post.call_count == 3
    
    @pytest.mark.asyncio
    async def test_exponential_backoff_timing(self, cloud_ai_client):
        """Test exponential backoff timing: 1s, 2s, 4s (Requirement 6.5)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            with patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:
                # All attempts fail
                mock_post.side_effect = httpx.TimeoutException("Timeout")
                
                result = await cloud_ai_client.llama(prompt="Test")
                
                assert result["success"] is False
                
                # Verify exponential backoff: 1s, 2s (no sleep after last attempt)
                assert mock_sleep.call_count == 2
                sleep_calls = [call[0][0] for call in mock_sleep.call_args_list]
                assert sleep_calls == [1, 2]  # 2^0=1, 2^1=2
    
    @pytest.mark.asyncio
    async def test_retry_on_rate_limit(self, cloud_ai_client):
        """Test retry on rate limit (HTTP 429)"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            # First attempt rate limited, second succeeds
            rate_limit_response = MagicMock()
            rate_limit_response.status_code = 429
            rate_limit_response.json.return_value = {
                "error": {"message": "Rate limit exceeded"}
            }
            
            success_response = MagicMock()
            success_response.status_code = 200
            success_response.json.return_value = {
                "choices": [{"message": {"content": "Success"}}],
                "usage": {"total_tokens": 10}
            }
            
            mock_post.side_effect = [
                httpx.HTTPStatusError("Rate limit", request=MagicMock(), response=rate_limit_response),
                success_response
            ]
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is True
            assert mock_post.call_count == 2
    
    @pytest.mark.asyncio
    async def test_no_retry_on_connection_error(self, cloud_ai_client):
        """Test that connection errors don't retry"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectError("Connection failed")
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is False
            assert "Failed to connect" in result["error"]
            # Should only try once, no retries on connection errors
            assert mock_post.call_count == 1


class TestCloudAIErrorHandling:
    """Test CloudAI error handling"""
    
    @pytest.mark.asyncio
    async def test_missing_response_content(self, cloud_ai_client):
        """Test handling of missing response content"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"choices": []}  # Empty choices
            mock_post.return_value = mock_response
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is False
            assert "No response content" in result["error"]
    
    @pytest.mark.asyncio
    async def test_http_error_handling(self, cloud_ai_client):
        """Test handling of HTTP errors"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            error_response = MagicMock()
            error_response.status_code = 500
            error_response.json.return_value = {
                "error": {"message": "Internal server error"}
            }
            
            mock_post.side_effect = httpx.HTTPStatusError(
                "Server error",
                request=MagicMock(),
                response=error_response
            )
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is False
            assert "HTTP 500" in result["error"]
    
    @pytest.mark.asyncio
    async def test_unexpected_exception(self, cloud_ai_client):
        """Test handling of unexpected exceptions"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = Exception("Unexpected error")
            
            result = await cloud_ai_client.llama(prompt="Test")
            
            assert result["success"] is False
            assert "Unexpected error" in result["error"]


class TestCloudAIHealthCheck:
    """Test CloudAI health check"""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, cloud_ai_client):
        """Test successful health check"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [{"message": {"content": "test"}}],
                "usage": {"total_tokens": 1}
            }
            mock_post.return_value = mock_response
            
            result = await cloud_ai_client.health_check()
            
            assert result["healthy"] is True
            assert "latency_ms" in result
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, cloud_ai_client):
        """Test failed health check"""
        with patch.object(cloud_ai_client.client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectError("Connection failed")
            
            result = await cloud_ai_client.health_check()
            
            assert result["healthy"] is False
            assert "error" in result
            assert "latency_ms" in result


class TestCloudAIContextManager:
    """Test CloudAI async context manager"""
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test that CloudAI works as async context manager"""
        async with CloudAI(api_key="test-key") as client:
            assert client.api_key == "test-key"
            assert client.client is not None
        
        # Client should be closed after context exit
        # Note: We can't easily test this without accessing internal state


class TestCloudAIResponseCaching:
    """Test CloudAI response caching (Requirement 6.7)"""
    
    def test_generate_cache_key(self, cloud_ai_client):
        """Test cache key generation from prompt hash"""
        key1 = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Test prompt",
            system_prompt="System prompt",
            temperature=0.7,
            max_tokens=2048
        )
        
        # Should return a string with the correct prefix
        assert isinstance(key1, str)
        assert key1.startswith("ai:cloudai:")
        assert len(key1) > len("ai:cloudai:")
        
        # Same inputs should produce same key
        key2 = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Test prompt",
            system_prompt="System prompt",
            temperature=0.7,
            max_tokens=2048
        )
        assert key1 == key2
        
        # Different inputs should produce different keys
        key3 = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Different prompt",
            system_prompt="System prompt",
            temperature=0.7,
            max_tokens=2048
        )
        assert key1 != key3
    
    def test_generate_cache_key_deterministic(self, cloud_ai_client):
        """Test that cache key generation is deterministic"""
        # Generate key multiple times with same inputs
        keys = [
            cloud_ai_client._generate_cache_key(
                model="llama-3.1-8b",
                prompt="Generate a business plan",
                temperature=0.7,
                max_tokens=4096
            )
            for _ in range(5)
        ]
        
        # All keys should be identical
        assert len(set(keys)) == 1
    
    def test_generate_cache_key_parameter_sensitivity(self, cloud_ai_client):
        """Test that cache key changes with different parameters"""
        base_key = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Test prompt",
            temperature=0.7,
            max_tokens=2048
        )
        
        # Different temperature
        temp_key = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Test prompt",
            temperature=0.8,
            max_tokens=2048
        )
        assert base_key != temp_key
        
        # Different max_tokens
        tokens_key = cloud_ai_client._generate_cache_key(
            model="test-model",
            prompt="Test prompt",
            temperature=0.7,
            max_tokens=4096
        )
        assert base_key != tokens_key
        
        # Different model
        model_key = cloud_ai_client._generate_cache_key(
            model="different-model",
            prompt="Test prompt",
            temperature=0.7,
            max_tokens=2048
        )
        assert base_key != model_key
    
    @pytest.mark.asyncio
    async def test_get_cached_response_no_redis(self, cloud_ai_client):
        """Test that get_cached_response returns None when Redis is not configured"""
        # cloud_ai_client has no redis_client by default
        result = await cloud_ai_client._get_cached_response("test-key")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_response_no_redis(self, cloud_ai_client):
        """Test that cache_response returns False when Redis is not configured"""
        # cloud_ai_client has no redis_client by default
        result = await cloud_ai_client._cache_response("test-key", {"data": "test"})
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_cached_response_with_redis(self, mock_httpx_response):
        """Test retrieving cached response from Redis"""
        # Create mock Redis client
        mock_redis = MagicMock()
        
        # Create client with Redis
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        # Mock the cache_get function
        cached_data = {
            "success": True,
            "response": "Cached response",
            "model": "test-model",
            "tokens": 50
        }
        
        with patch('app.db.redis.cache_get', new_callable=AsyncMock) as mock_cache_get:
            mock_cache_get.return_value = cached_data
            
            result = await client._get_cached_response("ai:cloudai:test123")
            
            assert result == cached_data
            mock_cache_get.assert_called_once_with("ai:cloudai:test123")
    
    @pytest.mark.asyncio
    async def test_get_cached_response_cache_miss(self):
        """Test cache miss returns None"""
        mock_redis = MagicMock()
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        with patch('app.db.redis.cache_get', new_callable=AsyncMock) as mock_cache_get:
            mock_cache_get.return_value = None
            
            result = await client._get_cached_response("ai:cloudai:test123")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_response_with_redis(self):
        """Test caching response to Redis"""
        mock_redis = MagicMock()
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        response_data = {
            "success": True,
            "response": "Test response",
            "model": "test-model",
            "tokens": 50
        }
        
        with patch('app.db.redis.cache_ai_response', new_callable=AsyncMock) as mock_cache_ai:
            mock_cache_ai.return_value = True
            
            result = await client._cache_response("ai:cloudai:test123", response_data)
            
            assert result is True
            mock_cache_ai.assert_called_once_with("test123", response_data)
    
    @pytest.mark.asyncio
    async def test_generate_uses_cache(self, mock_httpx_response):
        """Test that _generate checks cache before making API call"""
        mock_redis = MagicMock()
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        cached_response = {
            "success": True,
            "response": "Cached response",
            "model": "test-model",
            "tokens": 50,
            "latency_ms": 100
        }
        
        with patch('app.db.redis.cache_get', new_callable=AsyncMock) as mock_cache_get:
            mock_cache_get.return_value = cached_response
            
            with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
                result = await client.llama(prompt="Test prompt")
                
                # Should return cached response
                assert result["success"] is True
                assert result["response"] == "Cached response"
                assert result["cached"] is True
                
                # Should NOT make API call
                mock_post.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_generate_caches_successful_response(self, mock_httpx_response):
        """Test that _generate caches successful API responses"""
        mock_redis = MagicMock()
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        with patch('app.db.redis.cache_get', new_callable=AsyncMock) as mock_cache_get:
            # Cache miss
            mock_cache_get.return_value = None
            
            with patch('app.db.redis.cache_ai_response', new_callable=AsyncMock) as mock_cache_ai:
                mock_cache_ai.return_value = True
                
                with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
                    mock_post.return_value = mock_httpx_response
                    
                    result = await client.llama(prompt="Test prompt")
                    
                    # Should return successful response
                    assert result["success"] is True
                    assert result["cached"] is False
                    
                    # Should cache the response
                    mock_cache_ai.assert_called_once()
                    cached_data = mock_cache_ai.call_args[0][1]
                    assert cached_data["success"] is True
                    assert cached_data["response"] == "This is a test response from the AI model."
    
    @pytest.mark.asyncio
    async def test_generate_does_not_cache_failed_response(self):
        """Test that _generate does not cache failed API responses"""
        mock_redis = MagicMock()
        client = CloudAI(api_key="test-key", redis_client=mock_redis)
        
        with patch('app.db.redis.cache_get', new_callable=AsyncMock) as mock_cache_get:
            # Cache miss
            mock_cache_get.return_value = None
            
            with patch('app.db.redis.cache_ai_response', new_callable=AsyncMock) as mock_cache_ai:
                with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
                    # All attempts fail
                    mock_post.side_effect = httpx.TimeoutException("Timeout")
                    
                    result = await client.llama(prompt="Test prompt")
                    
                    # Should return failed response
                    assert result["success"] is False
                    
                    # Should NOT cache the failed response
                    mock_cache_ai.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_cache_key_includes_all_parameters(self):
        """Test that cache key includes model, prompt, system_prompt, temperature, and max_tokens"""
        client = CloudAI(api_key="test-key")
        
        # Generate keys with different combinations
        key1 = client._generate_cache_key(
            model="model1",
            prompt="prompt1",
            system_prompt="system1",
            temperature=0.7,
            max_tokens=2048
        )
        
        key2 = client._generate_cache_key(
            model="model1",
            prompt="prompt1",
            system_prompt="system2",  # Different system prompt
            temperature=0.7,
            max_tokens=2048
        )
        
        # Keys should be different
        assert key1 != key2
        
        # Test with None system_prompt
        key3 = client._generate_cache_key(
            model="model1",
            prompt="prompt1",
            system_prompt=None,
            temperature=0.7,
            max_tokens=2048
        )
        
        assert key1 != key3
        assert key2 != key3
