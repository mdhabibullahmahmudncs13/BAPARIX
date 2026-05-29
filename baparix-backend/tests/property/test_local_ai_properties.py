"""
Property-Based Tests for Local AI

Tests correctness properties for Local AI response time and privacy guarantees
using Hypothesis for property-based testing.

**Validates: Requirements 5.6, 5.7**
"""

import os
import time
from typing import Dict, Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from hypothesis import given, settings, strategies as st, assume, HealthCheck

from app.core.local_ai import LocalAI


# Configure Hypothesis profiles
# Using max_examples=5 for faster test execution as per task requirements
settings.register_profile("ci", max_examples=5, deadline=5000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.register_profile("dev", max_examples=5, deadline=2000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategies for generating test data
prompt_strategy = st.text(min_size=10, max_size=500)
short_prompt_strategy = st.text(min_size=5, max_size=100)
chinese_text_strategy = st.sampled_from([
    "无线蓝牙耳机",
    "高端智能手机",
    "笔记本电脑",
    "运动鞋",
    "女士手提包",
    "儿童玩具",
    "厨房用具",
    "办公用品",
])
target_language_strategy = st.sampled_from(["bengali", "bn", "english", "en"])
financial_text_strategy = st.sampled_from([
    "Paid office rent for January",
    "Purchased office supplies",
    "Marketing campaign expenses",
    "Employee salary payment",
    "Utility bills for the month",
    "Product shipping costs",
    "Customs duty payment",
])
temperature_strategy = st.floats(min_value=0.0, max_value=1.0)
max_tokens_strategy = st.integers(min_value=100, max_value=2048)


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 17: Local AI Response Time")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    temperature=temperature_strategy,
    max_tokens=max_tokens_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_response_time_generate(prompt, temperature, max_tokens):
    """
    Feature: ventureos-backend, Property 17: Local AI Response Time
    
    **Validates: Requirements 5.6**
    
    Property: For any Local AI Model request, the response time should be 
    less than 2 seconds.
    
    This property verifies that:
    1. All generate() requests complete within 2 seconds
    2. Response includes latency_ms field
    3. Latency is measured accurately
    4. Response time requirement is met regardless of prompt length
    5. Response time requirement is met regardless of parameters
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create LocalAI client with 2-second timeout
    client = LocalAI(timeout=2)
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "This is a generated response from the local AI model.",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    # Track actual execution time
    start_time = time.time()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
        result = await client.generate(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    end_time = time.time()
    actual_duration = end_time - start_time
    
    # Property 1: Request should complete successfully
    assert result["success"] is True, (
        f"Local AI request should succeed, got error: {result.get('error')}"
    )
    
    # Property 2: Response should include latency_ms field
    assert "latency_ms" in result, (
        f"Response should include 'latency_ms' field"
    )
    
    # Property 3: Latency should be a non-negative integer
    assert isinstance(result["latency_ms"], int), (
        f"latency_ms should be int, got {type(result['latency_ms'])}"
    )
    assert result["latency_ms"] >= 0, (
        f"latency_ms should be non-negative, got {result['latency_ms']}"
    )
    
    # Property 4: Response time should be less than 2 seconds (2000ms)
    assert result["latency_ms"] < 2000, (
        f"Local AI response time should be < 2000ms, got {result['latency_ms']}ms"
    )
    
    # Property 5: Actual execution time should also be less than 2 seconds
    # Allow small overhead for test execution (2.5s total)
    assert actual_duration < 2.5, (
        f"Actual execution time should be < 2.5s, got {actual_duration:.2f}s"
    )
    
    # Property 6: Response should contain generated text
    assert "response" in result, (
        f"Response should include 'response' field"
    )
    assert len(result["response"]) > 0, (
        f"Response text should not be empty"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 17: Local AI Response Time")
@settings(max_examples=5)
@given(
    text=chinese_text_strategy,
    target_language=target_language_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_response_time_translate(text, target_language):
    """
    Feature: ventureos-backend, Property 17: Local AI Response Time
    
    **Validates: Requirements 5.6**
    
    Property: For any Local AI Model translation request, the response time 
    should be less than 2 seconds.
    
    This property verifies that:
    1. All translate() requests complete within 2 seconds
    2. Response includes latency_ms field
    3. Translation completes within time limit
    4. Response time requirement is met for various target languages
    """
    # Create LocalAI client with 2-second timeout
    client = LocalAI(timeout=2)
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "Wireless Bluetooth Earphones",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    # Track actual execution time
    start_time = time.time()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
        result = await client.translate(
            text=text,
            target_language=target_language
        )
    
    end_time = time.time()
    actual_duration = end_time - start_time
    
    # Property 1: Request should complete successfully
    assert result["success"] is True, (
        f"Local AI translation should succeed, got error: {result.get('error')}"
    )
    
    # Property 2: Response should include latency_ms field
    assert "latency_ms" in result, (
        f"Translation response should include 'latency_ms' field"
    )
    
    # Property 3: Response time should be less than 2 seconds (2000ms)
    assert result["latency_ms"] < 2000, (
        f"Local AI translation response time should be < 2000ms, "
        f"got {result['latency_ms']}ms"
    )
    
    # Property 4: Actual execution time should also be less than 2 seconds
    assert actual_duration < 2.5, (
        f"Actual translation execution time should be < 2.5s, "
        f"got {actual_duration:.2f}s"
    )
    
    # Property 5: Response should contain translated text
    assert "translated_text" in result, (
        f"Translation response should include 'translated_text' field"
    )
    assert len(result["translated_text"]) > 0, (
        f"Translated text should not be empty"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 17: Local AI Response Time")
@settings(max_examples=5)
@given(
    text=financial_text_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_response_time_tag(text):
    """
    Feature: ventureos-backend, Property 17: Local AI Response Time
    
    **Validates: Requirements 5.6**
    
    Property: For any Local AI Model categorization request, the response 
    time should be less than 2 seconds.
    
    This property verifies that:
    1. All tag() requests complete within 2 seconds
    2. Response includes latency_ms field
    3. Categorization completes within time limit
    4. Response time requirement is met for various text inputs
    """
    # Create LocalAI client with 2-second timeout
    client = LocalAI(timeout=2)
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "rent",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    # Track actual execution time
    start_time = time.time()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response):
        result = await client.tag(text=text)
    
    end_time = time.time()
    actual_duration = end_time - start_time
    
    # Property 1: Request should complete successfully
    assert result["success"] is True, (
        f"Local AI categorization should succeed, got error: {result.get('error')}"
    )
    
    # Property 2: Response should include latency_ms field
    assert "latency_ms" in result, (
        f"Categorization response should include 'latency_ms' field"
    )
    
    # Property 3: Response time should be less than 2 seconds (2000ms)
    assert result["latency_ms"] < 2000, (
        f"Local AI categorization response time should be < 2000ms, "
        f"got {result['latency_ms']}ms"
    )
    
    # Property 4: Actual execution time should also be less than 2 seconds
    assert actual_duration < 2.5, (
        f"Actual categorization execution time should be < 2.5s, "
        f"got {actual_duration:.2f}s"
    )
    
    # Property 5: Response should contain category
    assert "category" in result, (
        f"Categorization response should include 'category' field"
    )
    assert len(result["category"]) > 0, (
        f"Category should not be empty"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_privacy_generate(prompt):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model request, no external network calls 
    should be made (all processing happens locally).
    
    This property verifies that:
    1. All generate() requests only call localhost endpoints
    2. No external URLs are contacted
    3. Request uses relative path (base_url is localhost)
    4. No external domains in request payload
    5. HTTP client is configured with localhost base_url
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create LocalAI client with default localhost configuration
    client = LocalAI()
    
    # Property 1: Verify base_url is localhost
    assert "localhost" in client.base_url or "127.0.0.1" in client.base_url, (
        f"LocalAI base_url should be localhost, got {client.base_url}"
    )
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "Generated response",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
        result = await client.generate(prompt=prompt)
        
        # Property 2: Verify request was made
        assert mock_post.call_count == 1, (
            f"Exactly one request should be made"
        )
        
        # Property 3: Verify the endpoint is local (relative path)
        call_args = mock_post.call_args
        endpoint = call_args[0][0]
        assert endpoint == "/api/generate", (
            f"Endpoint should be '/api/generate', got '{endpoint}'"
        )
        
        # Property 4: Verify no absolute URLs to external services
        assert not endpoint.startswith("http://") or "localhost" in endpoint, (
            f"Endpoint should not be an external HTTP URL"
        )
        assert not endpoint.startswith("https://"), (
            f"Endpoint should not be an external HTTPS URL"
        )
        
        # Property 5: Verify payload doesn't contain external URLs
        payload = call_args[1]["json"]
        payload_str = str(payload)
        
        # Check for common external AI service domains
        external_domains = [
            "api.openai.com",
            "api.anthropic.com",
            "openrouter.ai",
            "api.cohere.ai",
            "api.together.xyz",
        ]
        
        for domain in external_domains:
            assert domain not in payload_str, (
                f"Payload should not contain external domain '{domain}'"
            )
        
        # Property 6: Verify HTTPS URLs in payload (if any) are not external
        if "https://" in payload_str:
            # If there are any HTTPS URLs, they should be localhost
            assert "localhost" in payload_str or "127.0.0.1" in payload_str, (
                f"Any HTTPS URLs in payload should be localhost"
            )
    
    # Property 7: Verify HTTP client base_url is localhost
    assert "localhost" in str(client.client.base_url) or "127.0.0.1" in str(client.client.base_url), (
        f"HTTP client base_url should be localhost, got {client.client.base_url}"
    )
    
    # Property 8: Verify request succeeded
    assert result["success"] is True, (
        f"Local AI request should succeed"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    text=chinese_text_strategy,
    target_language=target_language_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_privacy_translate(text, target_language):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model translation request, no external 
    network calls should be made (all processing happens locally).
    
    This property verifies that:
    1. All translate() requests only call localhost endpoints
    2. No external translation services are contacted
    3. Product data stays on local system
    4. No external APIs are used for translation
    """
    # Create LocalAI client with default localhost configuration
    client = LocalAI()
    
    # Property 1: Verify base_url is localhost
    assert "localhost" in client.base_url or "127.0.0.1" in client.base_url, (
        f"LocalAI base_url should be localhost for translation"
    )
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "Translated text",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
        result = await client.translate(
            text=text,
            target_language=target_language
        )
        
        # Property 2: Verify only local endpoint was called
        assert mock_post.call_count == 1, (
            f"Exactly one request should be made for translation"
        )
        
        # Property 3: Verify the endpoint is local
        call_args = mock_post.call_args
        endpoint = call_args[0][0]
        assert endpoint == "/api/generate", (
            f"Translation should use local '/api/generate' endpoint"
        )
        
        # Property 4: Verify no external translation services
        assert not endpoint.startswith("https://"), (
            f"Translation should not use external HTTPS services"
        )
        
        # Property 5: Verify payload contains the text to translate
        payload = call_args[1]["json"]
        payload_str = str(payload)
        
        # The text should be in the prompt
        assert text in payload_str or "translate" in payload_str.lower(), (
            f"Payload should contain translation request"
        )
        
        # Property 6: Verify no external translation API domains
        external_translation_services = [
            "translate.google.com",
            "api.deepl.com",
            "api.mymemory.translated.net",
            "microsoft.com/translator",
        ]
        
        for service in external_translation_services:
            assert service not in payload_str, (
                f"Translation should not use external service '{service}'"
            )
    
    # Property 7: Verify request succeeded
    assert result["success"] is True, (
        f"Local AI translation should succeed"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    text=financial_text_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_privacy_tag(text):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model categorization request, no external 
    network calls should be made (all processing happens locally).
    
    This property verifies that:
    1. All tag() requests only call localhost endpoints
    2. No external classification services are contacted
    3. Financial data stays on local system
    4. No external APIs are used for categorization
    """
    # Create LocalAI client with default localhost configuration
    client = LocalAI()
    
    # Property 1: Verify base_url is localhost
    assert "localhost" in client.base_url or "127.0.0.1" in client.base_url, (
        f"LocalAI base_url should be localhost for categorization"
    )
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "rent",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
        result = await client.tag(text=text)
        
        # Property 2: Verify only local endpoint was called
        assert mock_post.call_count == 1, (
            f"Exactly one request should be made for categorization"
        )
        
        # Property 3: Verify the endpoint is local
        call_args = mock_post.call_args
        endpoint = call_args[0][0]
        assert endpoint == "/api/generate", (
            f"Categorization should use local '/api/generate' endpoint"
        )
        
        # Property 4: Verify no external classification services
        assert not endpoint.startswith("https://"), (
            f"Categorization should not use external HTTPS services"
        )
        
        # Property 5: Verify payload contains the text to categorize
        payload = call_args[1]["json"]
        payload_str = str(payload)
        
        # The text should be in the prompt
        assert text in payload_str or "categorize" in payload_str.lower(), (
            f"Payload should contain categorization request"
        )
        
        # Property 6: Verify no external classification API domains
        external_classification_services = [
            "api.openai.com",
            "api.cohere.ai",
            "api.huggingface.co",
        ]
        
        for service in external_classification_services:
            assert service not in payload_str, (
                f"Categorization should not use external service '{service}'"
            )
    
    # Property 7: Verify request succeeded
    assert result["success"] is True, (
        f"Local AI categorization should succeed"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_privacy_no_external_on_retry(prompt):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model request that requires retry, no 
    external network calls should be made during retry attempts.
    
    This property verifies that:
    1. Retry logic doesn't introduce external network calls
    2. All retry attempts go to localhost only
    3. Failed requests don't fall back to external services
    4. Privacy is maintained even during error conditions
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create LocalAI client with retry enabled
    client = LocalAI(max_retries=2)
    
    # Mock the HTTP response - first call fails, second succeeds
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "Success after retry",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    import httpx
    
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=[httpx.TimeoutException("Timeout"), mock_response]
    ) as mock_post:
        result = await client.generate(prompt=prompt)
        
        # Property 1: Verify both attempts were made
        assert mock_post.call_count == 2, (
            f"Two attempts should be made (initial + 1 retry)"
        )
        
        # Property 2: Verify both attempts used the same local endpoint
        for call_item in mock_post.call_args_list:
            endpoint = call_item[0][0]
            assert endpoint == "/api/generate", (
                f"All retry attempts should use local endpoint, got '{endpoint}'"
            )
            
            # Verify no external URLs
            assert not endpoint.startswith("https://"), (
                f"Retry attempts should not use external HTTPS URLs"
            )
        
        # Property 3: Verify request eventually succeeded
        assert result["success"] is True, (
            f"Request should succeed after retry"
        )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    prompt=short_prompt_strategy,
)
@pytest.mark.asyncio
async def test_local_ai_privacy_no_external_on_error(prompt):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model request that fails, no external 
    network calls should be made as fallback.
    
    This property verifies that:
    1. Failed requests don't trigger external API calls
    2. Error conditions maintain privacy guarantees
    3. No fallback to external services occurs
    4. Client fails gracefully without external access
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create LocalAI client
    client = LocalAI()
    
    import httpx
    
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=httpx.ConnectError("Connection failed")
    ) as mock_post:
        result = await client.generate(prompt=prompt)
        
        # Property 1: Verify the request failed locally
        assert result["success"] is False, (
            f"Request should fail when local service is unavailable"
        )
        
        # Property 2: Verify only one attempt was made (to localhost)
        assert mock_post.call_count == 1, (
            f"Only one attempt should be made to localhost"
        )
        
        # Property 3: Verify the attempt was to local endpoint
        call_args = mock_post.call_args
        endpoint = call_args[0][0]
        assert endpoint == "/api/generate", (
            f"Failed request should still use local endpoint"
        )
        
        # Property 4: Verify no external URLs were attempted
        assert not endpoint.startswith("https://"), (
            f"Failed request should not fall back to external HTTPS services"
        )
        
        # Property 5: Verify error message indicates local failure
        assert "error" in result, (
            f"Failed request should include error message"
        )
        assert "connect" in result["error"].lower(), (
            f"Error should indicate connection failure to local service"
        )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 18: Local AI Privacy")
@settings(max_examples=5)
@given(
    base_url=st.sampled_from([
        "http://localhost:11434",
        "http://127.0.0.1:11434",
        "http://192.168.1.100:11434",
        "http://10.0.0.50:11434",
    ]),
)
@pytest.mark.asyncio
async def test_local_ai_privacy_custom_base_url(base_url):
    """
    Feature: ventureos-backend, Property 18: Local AI Privacy
    
    **Validates: Requirements 5.7**
    
    Property: For any Local AI Model request with custom base_url, all 
    requests should go to the configured base_url (not external services).
    
    This property verifies that:
    1. Custom base_url is respected
    2. No external services are contacted
    3. All requests use the configured local endpoint
    4. Privacy is maintained with custom configurations
    """
    # Create LocalAI client with custom base_url
    client = LocalAI(base_url=base_url)
    
    # Property 1: Verify base_url is set correctly
    assert client.base_url == base_url.rstrip("/"), (
        f"Client base_url should be '{base_url}', got '{client.base_url}'"
    )
    
    # Property 2: Verify base_url is a local/private IP
    # Local IPs: localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    assert (
        "localhost" in client.base_url or
        "127.0.0.1" in client.base_url or
        "192.168." in client.base_url or
        "10." in client.base_url or
        "172.16." in client.base_url or
        "172.17." in client.base_url or
        "172.18." in client.base_url or
        "172.19." in client.base_url or
        "172.20." in client.base_url or
        "172.21." in client.base_url or
        "172.22." in client.base_url or
        "172.23." in client.base_url or
        "172.24." in client.base_url or
        "172.25." in client.base_url or
        "172.26." in client.base_url or
        "172.27." in client.base_url or
        "172.28." in client.base_url or
        "172.29." in client.base_url or
        "172.30." in client.base_url or
        "172.31." in client.base_url
    ), (
        f"Base URL should be a local/private IP address, got '{client.base_url}'"
    )
    
    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "response": "Test response",
        "model": "qwen2.5:7b"
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_response) as mock_post:
        result = await client.generate(prompt="Test prompt")
        
        # Property 3: Verify request was made to local endpoint
        assert mock_post.call_count == 1, (
            f"Request should be made to configured base_url"
        )
        
        # Property 4: Verify endpoint is relative (base_url is applied by httpx)
        call_args = mock_post.call_args
        endpoint = call_args[0][0]
        assert endpoint == "/api/generate", (
            f"Endpoint should be relative path '/api/generate'"
        )
        
        # Property 5: Verify no external URLs in request
        assert not endpoint.startswith("https://"), (
            f"Request should not use external HTTPS URLs"
        )
    
    # Property 6: Verify request succeeded
    assert result["success"] is True, (
        f"Request with custom base_url should succeed"
    )
