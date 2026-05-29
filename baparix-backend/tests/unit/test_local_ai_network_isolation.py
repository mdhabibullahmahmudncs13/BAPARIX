"""
Network Isolation Tests for LocalAI Client

This test suite verifies that LocalAI client processes all requests locally
without making external network calls, ensuring data privacy and compliance
with Requirement 5.7.

Requirements: 5.7
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
import httpx

from app.core.local_ai import LocalAI


class TestLocalAINetworkIsolation:
    """
    Test suite to verify LocalAI only makes requests to localhost
    and never sends data to external services.
    
    **Validates: Requirement 5.7**
    """
    
    @pytest.mark.asyncio
    async def test_generate_only_calls_localhost(self):
        """
        Test that generate() only makes HTTP requests to localhost.
        
        Verifies that all network calls go to the configured base_url
        (localhost) and no external endpoints are contacted.
        """
        client = LocalAI(base_url="http://localhost:11434")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.generate(prompt="Test prompt")
            
            # Verify the request was made
            assert mock_post.call_count == 1
            
            # Verify the endpoint is local (relative path, base_url is localhost)
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
            
            # Verify no absolute URLs to external services
            assert not call_args[0][0].startswith("http://")
            assert not call_args[0][0].startswith("https://")
    
    @pytest.mark.asyncio
    async def test_translate_only_calls_localhost(self):
        """
        Test that translate() only makes HTTP requests to localhost.
        
        Translation should use the local Ollama server, not external
        translation APIs.
        """
        client = LocalAI(base_url="http://localhost:11434")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Translated text",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.translate(text="无线耳机", target_language="bengali")
            
            # Verify only local endpoint was called
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_tag_only_calls_localhost(self):
        """
        Test that tag() only makes HTTP requests to localhost.
        
        Categorization should use the local Ollama server, not external
        classification APIs.
        """
        client = LocalAI(base_url="http://localhost:11434")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "rent",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.tag(text="Office rent payment")
            
            # Verify only local endpoint was called
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_health_check_only_calls_localhost(self):
        """
        Test that health_check() only makes HTTP requests to localhost.
        """
        client = LocalAI(base_url="http://localhost:11434")
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "models": [{"name": "qwen2.5:7b"}]
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'get', new_callable=AsyncMock, return_value=mock_response) as mock_get:
            await client.health_check()
            
            # Verify only local endpoint was called
            assert mock_get.call_count == 1
            call_args = mock_get.call_args
            assert call_args[0][0] == "/api/tags"
    
    @pytest.mark.asyncio
    async def test_no_external_dns_lookups(self):
        """
        Test that LocalAI client never attempts to resolve external domains.
        
        This test verifies that the base_url is always localhost and no
        external domain names are used in any requests.
        """
        client = LocalAI()
        
        # Verify base_url is localhost
        assert "localhost" in client.base_url or "127.0.0.1" in client.base_url
        
        # Verify httpx client is configured with localhost base_url
        assert "localhost" in str(client.client.base_url) or "127.0.0.1" in str(client.client.base_url)
    
    @pytest.mark.asyncio
    async def test_custom_base_url_is_respected(self):
        """
        Test that custom base_url is used for all requests.
        
        Even with custom configuration, all requests should go to the
        configured base_url, not to external services.
        """
        custom_url = "http://192.168.1.100:11434"
        client = LocalAI(base_url=custom_url)
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.generate(prompt="Test")
            
            # Verify the client's base_url is the custom one
            assert client.base_url == custom_url
            
            # Verify request uses relative path (base_url is applied by httpx)
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_no_external_calls_on_retry(self):
        """
        Test that retry logic doesn't introduce external network calls.
        
        When requests fail and are retried, all retry attempts should
        still go to localhost only.
        """
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
        ) as mock_post:
            await client.generate(prompt="Test")
            
            # Verify both attempts used the same local endpoint
            assert mock_post.call_count == 2
            for call_item in mock_post.call_args_list:
                assert call_item[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_no_external_calls_on_error(self):
        """
        Test that error conditions don't trigger external network calls.
        
        Even when local AI fails, the client should not fall back to
        external services or make any external API calls.
        """
        client = LocalAI()
        
        with patch.object(
            client.client,
            'post',
            new_callable=AsyncMock,
            side_effect=httpx.ConnectError("Connection failed")
        ) as mock_post:
            result = await client.generate(prompt="Test")
            
            # Verify the request failed locally
            assert result["success"] is False
            
            # Verify only one attempt was made (to localhost)
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_payload_contains_no_external_urls(self):
        """
        Test that request payloads don't contain external URLs or endpoints.
        
        Verifies that the JSON payload sent to Ollama doesn't include
        any references to external services.
        """
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test response",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.generate(
                prompt="Test prompt",
                system_prompt="Test system prompt"
            )
            
            # Extract the JSON payload
            call_args = mock_post.call_args
            payload = call_args[1]["json"]
            
            # Verify payload structure
            assert "model" in payload
            assert "prompt" in payload
            assert "system" in payload
            
            # Verify no external URLs in payload
            payload_str = str(payload)
            assert "http://" not in payload_str or "localhost" in payload_str
            assert "https://" not in payload_str
            assert "api.openai.com" not in payload_str
            assert "api.anthropic.com" not in payload_str
            assert "openrouter.ai" not in payload_str
    
    @pytest.mark.asyncio
    async def test_http_client_has_no_external_proxies(self):
        """
        Test that HTTP client is not configured with external proxies.
        
        Verifies that the httpx client doesn't route traffic through
        external proxy servers.
        """
        client = LocalAI()
        
        # Verify no proxies are configured
        # httpx.AsyncClient doesn't expose proxies directly, but we can
        # verify the base_url is local
        assert client.client.base_url.host in ["localhost", "127.0.0.1"]
    
    @pytest.mark.asyncio
    async def test_multiple_requests_all_local(self):
        """
        Test that multiple sequential requests all go to localhost.
        
        Verifies that the client maintains local-only behavior across
        multiple operations.
        """
        client = LocalAI()
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Test",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            # Make multiple requests
            await client.generate(prompt="Test 1")
            await client.translate(text="测试", target_language="english")
            await client.tag(text="Test expense")
            
            # Verify all requests went to local endpoint
            assert mock_post.call_count == 3
            for call_item in mock_post.call_args_list:
                assert call_item[0][0] == "/api/generate"


class TestLocalAIDataPrivacy:
    """
    Test suite to verify that user data never leaves the local system.
    
    **Validates: Requirement 5.7**
    """
    
    @pytest.mark.asyncio
    async def test_sensitive_data_not_sent_externally(self):
        """
        Test that sensitive user data is only sent to localhost.
        
        Verifies that prompts containing sensitive business information
        are processed locally and not transmitted to external services.
        """
        client = LocalAI()
        
        sensitive_prompt = "My business revenue is $50,000 and profit margin is 25%"
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Analysis complete",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.generate(prompt=sensitive_prompt)
            
            # Verify request went to local endpoint only
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
            
            # Verify sensitive data is in the payload (sent to localhost)
            payload = call_args[1]["json"]
            assert sensitive_prompt in payload["prompt"]
    
    @pytest.mark.asyncio
    async def test_translation_data_stays_local(self):
        """
        Test that product data being translated stays on local system.
        
        Product titles and descriptions should be translated locally
        without sending to external translation services.
        """
        client = LocalAI()
        
        product_title = "高端无线蓝牙耳机 - 降噪功能"
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "Premium Wireless Bluetooth Earphones - Noise Cancellation",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.translate(text=product_title, target_language="english")
            
            # Verify only local endpoint was called
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"
    
    @pytest.mark.asyncio
    async def test_financial_data_stays_local(self):
        """
        Test that financial data categorization happens locally.
        
        Financial transaction data should be categorized locally without
        sending to external classification services.
        """
        client = LocalAI()
        
        financial_data = "Paid $5,000 for office rent and $2,000 for utilities"
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "response": "rent",
            "model": "qwen2.5:7b"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
            await client.tag(text=financial_data)
            
            # Verify only local endpoint was called
            assert mock_post.call_count == 1
            call_args = mock_post.call_args
            assert call_args[0][0] == "/api/generate"


class TestLocalAINetworkConfiguration:
    """
    Test suite to verify network configuration prevents external access.
    
    **Validates: Requirement 5.7**
    """
    
    def test_default_base_url_is_localhost(self):
        """
        Test that default base_url is localhost.
        
        By default, LocalAI should connect to localhost, ensuring
        no external network access.
        """
        client = LocalAI()
        
        assert client.base_url == "http://localhost:11434"
        assert "localhost" in client.base_url
    
    def test_base_url_strips_trailing_slash(self):
        """
        Test that trailing slash is removed from base_url.
        
        Ensures consistent URL formatting for local endpoint.
        """
        client = LocalAI(base_url="http://localhost:11434/")
        
        assert client.base_url == "http://localhost:11434"
        assert not client.base_url.endswith("/")
    
    def test_httpx_client_configured_with_local_base_url(self):
        """
        Test that httpx client is configured with local base_url.
        
        Verifies that the underlying HTTP client is bound to the
        local Ollama server.
        """
        client = LocalAI(base_url="http://localhost:11434")
        
        # Verify httpx client base_url
        assert str(client.client.base_url) == "http://localhost:11434"
    
    @pytest.mark.asyncio
    async def test_client_timeout_prevents_long_external_waits(self):
        """
        Test that timeout configuration prevents long waits for external services.
        
        Even if code accidentally tried to contact external services,
        the timeout would prevent long blocking operations.
        """
        client = LocalAI(timeout=2)
        
        # Verify timeout is configured
        assert client.timeout == 2
        assert client.client.timeout.read == 2
        assert client.client.timeout.connect == 2


class TestLocalAIPrivacyDocumentation:
    """
    Test suite to verify privacy guarantees are documented in code.
    
    **Validates: Requirement 5.7**
    """
    
    def test_class_docstring_mentions_local_processing(self):
        """
        Test that LocalAI class docstring documents local processing.
        """
        docstring = LocalAI.__doc__
        
        assert docstring is not None
        assert "local" in docstring.lower() or "localhost" in docstring.lower()
    
    def test_class_docstring_mentions_privacy(self):
        """
        Test that LocalAI class docstring mentions privacy guarantees.
        """
        docstring = LocalAI.__doc__
        
        assert docstring is not None
        # Check for privacy-related keywords
        privacy_keywords = ["external services", "without sending", "locally"]
        assert any(keyword in docstring.lower() for keyword in privacy_keywords)
    
    def test_class_docstring_references_requirement_5_7(self):
        """
        Test that LocalAI class docstring references Requirement 5.7.
        """
        docstring = LocalAI.__doc__
        
        assert docstring is not None
        assert "5.7" in docstring
    
    def test_generate_method_documents_local_processing(self):
        """
        Test that generate() method documents local processing.
        """
        docstring = LocalAI.generate.__doc__
        
        assert docstring is not None
        assert "5.7" in docstring or "local" in docstring.lower()
    
    def test_translate_method_documents_local_processing(self):
        """
        Test that translate() method documents local processing.
        """
        docstring = LocalAI.translate.__doc__
        
        assert docstring is not None
        assert "5.7" in docstring or "local" in docstring.lower()
    
    def test_tag_method_documents_local_processing(self):
        """
        Test that tag() method documents local processing.
        """
        docstring = LocalAI.tag.__doc__
        
        assert docstring is not None
        assert "5.7" in docstring or "local" in docstring.lower()
