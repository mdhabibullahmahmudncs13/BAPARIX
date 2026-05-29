"""
Property-Based Tests for Cloud AI

Tests correctness properties for Cloud AI retry logic and response caching
using Hypothesis for property-based testing.

**Validates: Requirements 6.5, 6.7**
"""

import asyncio
import os
import time
from typing import Dict, Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import httpx
from hypothesis import given, settings, strategies as st, assume, HealthCheck

from app.core.cloud_ai import CloudAI


# Configure Hypothesis profiles
# Using max_examples=5 for faster test execution as per task requirements
settings.register_profile("ci", max_examples=5, deadline=10000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.register_profile("dev", max_examples=5, deadline=5000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategies for generating test data
prompt_strategy = st.text(min_size=10, max_size=500)
short_prompt_strategy = st.text(min_size=5, max_size=100)
system_prompt_strategy = st.one_of(
    st.none(),
    st.text(min_size=10, max_size=200)
)
temperature_strategy = st.floats(min_value=0.0, max_value=1.0)
max_tokens_strategy = st.integers(min_value=100, max_value=4096)
model_strategy = st.sampled_from([
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
])


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 19: Cloud AI Retry Logic")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    system_prompt=system_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_retry_on_timeout(prompt, system_prompt):
    """
    Feature: ventureos-backend, Property 19: Cloud AI Retry Logic
    
    **Validates: Requirements 6.5**
    
    Property: For any Cloud AI request that fails with timeout, the system 
    should retry up to 3 times with exponential backoff (1s, 2s, 4s).
    
    This property verifies that:
    1. Failed requests are retried up to 3 times
    2. Exponential backoff is applied between retries (1s, 2s)
    3. Request succeeds if any retry succeeds
    4. All retry attempts are made before giving up
    5. Backoff timing is accurate
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create CloudAI client with 3 max retries
    client = CloudAI(api_key="test-key", max_retries=3)
    
    # Mock successful response
    mock_success_response = MagicMock()
    mock_success_response.status_code = 200
    mock_success_response.json.return_value = {
        "choices": [{"message": {"content": "Success after retry"}}],
        "usage": {"total_tokens": 50}
    }
    
    # Track sleep calls to verify exponential backoff
    sleep_times = []
    
    async def mock_sleep(seconds):
        sleep_times.append(seconds)
    
    # First 2 attempts timeout, 3rd succeeds
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=[
            httpx.TimeoutException("Timeout 1"),
            httpx.TimeoutException("Timeout 2"),
            mock_success_response
        ]
    ) as mock_post:
        with patch('asyncio.sleep', new_callable=AsyncMock, side_effect=mock_sleep):
            result = await client.llama(prompt=prompt, system_prompt=system_prompt)
    
    # Property 1: Request should eventually succeed
    assert result["success"] is True, (
        f"Request should succeed after retries, got error: {result.get('error')}"
    )
    
    # Property 2: Exactly 3 attempts should be made (initial + 2 retries)
    assert mock_post.call_count == 3, (
        f"Should make 3 attempts (initial + 2 retries), made {mock_post.call_count}"
    )
    
    # Property 3: Exponential backoff should be applied (1s, 2s)
    # Note: No sleep after the last successful attempt
    assert len(sleep_times) == 2, (
        f"Should sleep 2 times (after first 2 failures), slept {len(sleep_times)} times"
    )
    
    # Property 4: Backoff timing should be exponential (2^0=1, 2^1=2)
    assert sleep_times[0] == 1, (
        f"First backoff should be 1s, got {sleep_times[0]}s"
    )
    assert sleep_times[1] == 2, (
        f"Second backoff should be 2s, got {sleep_times[1]}s"
    )
    
    # Property 5: Response should contain the expected data
    assert "response" in result, (
        f"Result should contain 'response' field"
    )
    assert result["response"] == "Success after retry", (
        f"Response should match expected content"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 19: Cloud AI Retry Logic")
@settings(max_examples=5)
@given(
    prompt=short_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_retry_exhausted(prompt):
    """
    Feature: ventureos-backend, Property 19: Cloud AI Retry Logic
    
    **Validates: Requirements 6.5**
    
    Property: For any Cloud AI request where all retry attempts fail, 
    the system should return a failure after exactly 3 attempts.
    
    This property verifies that:
    1. System makes exactly 3 attempts when all fail
    2. Exponential backoff is applied between all attempts
    3. Final response indicates failure
    4. Error message includes retry count
    5. No additional attempts are made beyond max_retries
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create CloudAI client with 3 max retries
    client = CloudAI(api_key="test-key", max_retries=3)
    
    # Track sleep calls
    sleep_times = []
    
    async def mock_sleep(seconds):
        sleep_times.append(seconds)
    
    # All attempts timeout
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=httpx.TimeoutException("Timeout")
    ) as mock_post:
        with patch('asyncio.sleep', new_callable=AsyncMock, side_effect=mock_sleep):
            result = await client.llama(prompt=prompt)
    
    # Property 1: Request should fail
    assert result["success"] is False, (
        f"Request should fail when all retries are exhausted"
    )
    
    # Property 2: Exactly 3 attempts should be made
    assert mock_post.call_count == 3, (
        f"Should make exactly 3 attempts, made {mock_post.call_count}"
    )
    
    # Property 3: Exponential backoff should be applied (1s, 2s)
    # Note: No sleep after the last failed attempt
    assert len(sleep_times) == 2, (
        f"Should sleep 2 times (after first 2 failures), slept {len(sleep_times)} times"
    )
    
    # Property 4: Backoff timing should be exponential
    assert sleep_times[0] == 1, (
        f"First backoff should be 1s, got {sleep_times[0]}s"
    )
    assert sleep_times[1] == 2, (
        f"Second backoff should be 2s, got {sleep_times[1]}s"
    )
    
    # Property 5: Error message should indicate all attempts failed
    assert "error" in result, (
        f"Failed result should contain 'error' field"
    )
    assert "3 attempts failed" in result["error"], (
        f"Error should mention 3 failed attempts, got: {result['error']}"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 19: Cloud AI Retry Logic")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    temperature=temperature_strategy,
    max_tokens=max_tokens_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_retry_on_rate_limit(prompt, temperature, max_tokens):
    """
    Feature: ventureos-backend, Property 19: Cloud AI Retry Logic
    
    **Validates: Requirements 6.5**
    
    Property: For any Cloud AI request that fails with HTTP 429 (rate limit), 
    the system should retry with exponential backoff.
    
    This property verifies that:
    1. Rate limit errors trigger retry logic
    2. Exponential backoff is applied
    3. Request succeeds if retry succeeds
    4. HTTP 429 is handled as a retryable error
    5. Retry logic works regardless of request parameters
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    assume(0.0 <= temperature <= 1.0)
    assume(100 <= max_tokens <= 4096)
    
    # Create CloudAI client
    client = CloudAI(api_key="test-key", max_retries=3)
    
    # Mock rate limit response
    mock_rate_limit_response = MagicMock()
    mock_rate_limit_response.status_code = 429
    mock_rate_limit_response.json.return_value = {
        "error": {"message": "Rate limit exceeded"}
    }
    
    # Mock successful response
    mock_success_response = MagicMock()
    mock_success_response.status_code = 200
    mock_success_response.json.return_value = {
        "choices": [{"message": {"content": "Success after rate limit"}}],
        "usage": {"total_tokens": 50}
    }
    
    # Track sleep calls
    sleep_times = []
    
    async def mock_sleep(seconds):
        sleep_times.append(seconds)
    
    # First attempt rate limited, second succeeds
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=[
            httpx.HTTPStatusError(
                "Rate limit",
                request=MagicMock(),
                response=mock_rate_limit_response
            ),
            mock_success_response
        ]
    ) as mock_post:
        with patch('asyncio.sleep', new_callable=AsyncMock, side_effect=mock_sleep):
            result = await client.llama(
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
    
    # Property 1: Request should succeed after retry
    assert result["success"] is True, (
        f"Request should succeed after rate limit retry"
    )
    
    # Property 2: Exactly 2 attempts should be made
    assert mock_post.call_count == 2, (
        f"Should make 2 attempts (initial + 1 retry), made {mock_post.call_count}"
    )
    
    # Property 3: Exponential backoff should be applied (1s)
    assert len(sleep_times) == 1, (
        f"Should sleep 1 time (after rate limit), slept {len(sleep_times)} times"
    )
    assert sleep_times[0] == 1, (
        f"First backoff should be 1s, got {sleep_times[0]}s"
    )
    
    # Property 4: Response should contain the expected data
    assert "response" in result, (
        f"Result should contain 'response' field"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 19: Cloud AI Retry Logic")
@settings(max_examples=5)
@given(
    prompt=short_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_no_retry_on_connection_error(prompt):
    """
    Feature: ventureos-backend, Property 19: Cloud AI Retry Logic
    
    **Validates: Requirements 6.5**
    
    Property: For any Cloud AI request that fails with connection error, 
    the system should NOT retry (fail immediately).
    
    This property verifies that:
    1. Connection errors don't trigger retry logic
    2. Only 1 attempt is made for connection errors
    3. No backoff sleep occurs
    4. Error is returned immediately
    5. Connection errors are distinguished from retryable errors
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create CloudAI client
    client = CloudAI(api_key="test-key", max_retries=3)
    
    # Track sleep calls
    sleep_times = []
    
    async def mock_sleep(seconds):
        sleep_times.append(seconds)
    
    # Connection error
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=httpx.ConnectError("Connection failed")
    ) as mock_post:
        with patch('asyncio.sleep', new_callable=AsyncMock, side_effect=mock_sleep):
            result = await client.llama(prompt=prompt)
    
    # Property 1: Request should fail
    assert result["success"] is False, (
        f"Request should fail on connection error"
    )
    
    # Property 2: Only 1 attempt should be made (no retries)
    assert mock_post.call_count == 1, (
        f"Should make only 1 attempt for connection error, made {mock_post.call_count}"
    )
    
    # Property 3: No backoff sleep should occur
    assert len(sleep_times) == 0, (
        f"Should not sleep for connection errors, slept {len(sleep_times)} times"
    )
    
    # Property 4: Error message should indicate connection failure
    assert "error" in result, (
        f"Failed result should contain 'error' field"
    )
    assert "connect" in result["error"].lower(), (
        f"Error should mention connection failure, got: {result['error']}"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 19: Cloud AI Retry Logic")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    model=model_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_retry_backoff_sequence(prompt, model):
    """
    Feature: ventureos-backend, Property 19: Cloud AI Retry Logic
    
    **Validates: Requirements 6.5**
    
    Property: For any Cloud AI request that requires multiple retries, 
    the backoff sequence should be exactly 1s, 2s, 4s.
    
    This property verifies that:
    1. Backoff follows exponential pattern (2^n)
    2. Sequence is deterministic: 1s, 2s, 4s
    3. No sleep occurs after final attempt
    4. Backoff is consistent across different models
    5. Timing is accurate for all retry attempts
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create CloudAI client with 4 max retries to test full sequence
    client = CloudAI(api_key="test-key", max_retries=4)
    
    # Mock successful response
    mock_success_response = MagicMock()
    mock_success_response.status_code = 200
    mock_success_response.json.return_value = {
        "choices": [{"message": {"content": "Success"}}],
        "usage": {"total_tokens": 50}
    }
    
    # Track sleep calls
    sleep_times = []
    
    async def mock_sleep(seconds):
        sleep_times.append(seconds)
    
    # First 3 attempts timeout, 4th succeeds
    with patch.object(
        client.client,
        'post',
        new_callable=AsyncMock,
        side_effect=[
            httpx.TimeoutException("Timeout 1"),
            httpx.TimeoutException("Timeout 2"),
            httpx.TimeoutException("Timeout 3"),
            mock_success_response
        ]
    ) as mock_post:
        with patch('asyncio.sleep', new_callable=AsyncMock, side_effect=mock_sleep):
            result = await client._generate(
                model=model,
                prompt=prompt,
                temperature=0.7,
                max_tokens=2048,
                timeout=30
            )
    
    # Property 1: Request should succeed
    assert result["success"] is True, (
        f"Request should succeed after retries"
    )
    
    # Property 2: Exactly 4 attempts should be made
    assert mock_post.call_count == 4, (
        f"Should make 4 attempts, made {mock_post.call_count}"
    )
    
    # Property 3: Exactly 3 sleep calls (no sleep after success)
    assert len(sleep_times) == 3, (
        f"Should sleep 3 times, slept {len(sleep_times)} times"
    )
    
    # Property 4: Backoff sequence should be exactly 1s, 2s, 4s
    expected_backoff = [1, 2, 4]
    assert sleep_times == expected_backoff, (
        f"Backoff sequence should be {expected_backoff}, got {sleep_times}"
    )
    
    # Property 5: Each backoff should follow 2^n pattern
    for i, sleep_time in enumerate(sleep_times):
        expected = 2 ** i
        assert sleep_time == expected, (
            f"Backoff at index {i} should be {expected}s, got {sleep_time}s"
        )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    system_prompt=system_prompt_strategy,
    temperature=temperature_strategy,
    max_tokens=max_tokens_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_cache_key_deterministic(prompt, system_prompt, temperature, max_tokens):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request, the cache key should be deterministic 
    based on model, prompt, system_prompt, temperature, and max_tokens.
    
    This property verifies that:
    1. Same inputs produce same cache key
    2. Cache key is deterministic across multiple calls
    3. Cache key includes all relevant parameters
    4. Cache key format is consistent
    5. Cache key is suitable for Redis storage
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    assume(0.0 <= temperature <= 1.0)
    assume(100 <= max_tokens <= 4096)
    
    # Create CloudAI client
    client = CloudAI(api_key="test-key")
    
    # Generate cache key multiple times with same inputs
    cache_keys = [
        client._generate_cache_key(
            model="test-model",
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        for _ in range(5)
    ]
    
    # Property 1: All cache keys should be identical
    assert len(set(cache_keys)) == 1, (
        f"Cache keys should be deterministic, got {len(set(cache_keys))} unique keys"
    )
    
    # Property 2: Cache key should be a string
    cache_key = cache_keys[0]
    assert isinstance(cache_key, str), (
        f"Cache key should be string, got {type(cache_key)}"
    )
    
    # Property 3: Cache key should have correct prefix
    assert cache_key.startswith("ai:cloudai:"), (
        f"Cache key should start with 'ai:cloudai:', got '{cache_key[:20]}...'"
    )
    
    # Property 4: Cache key should be reasonably long (hash)
    assert len(cache_key) > 20, (
        f"Cache key should be long enough to be unique, got length {len(cache_key)}"
    )
    
    # Property 5: Cache key should not contain spaces or special chars
    # (except colon in prefix)
    key_without_prefix = cache_key.replace("ai:cloudai:", "")
    assert key_without_prefix.isalnum(), (
        f"Cache key hash should be alphanumeric, got '{key_without_prefix[:20]}...'"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    temperature=temperature_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_cache_key_parameter_sensitivity(prompt, temperature):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request, different parameters should produce 
    different cache keys.
    
    This property verifies that:
    1. Different prompts produce different cache keys
    2. Different temperatures produce different cache keys
    3. Different max_tokens produce different cache keys
    4. Different models produce different cache keys
    5. Cache keys are sensitive to all parameters
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    assume(0.0 <= temperature <= 1.0)
    
    # Create CloudAI client
    client = CloudAI(api_key="test-key")
    
    # Base cache key
    base_key = client._generate_cache_key(
        model="test-model",
        prompt=prompt,
        temperature=temperature,
        max_tokens=2048
    )
    
    # Property 1: Different prompt produces different key
    different_prompt_key = client._generate_cache_key(
        model="test-model",
        prompt=prompt + " different",
        temperature=temperature,
        max_tokens=2048
    )
    assert base_key != different_prompt_key, (
        f"Different prompts should produce different cache keys"
    )
    
    # Property 2: Different temperature produces different key
    different_temp = (temperature + 0.1) % 1.0
    different_temp_key = client._generate_cache_key(
        model="test-model",
        prompt=prompt,
        temperature=different_temp,
        max_tokens=2048
    )
    assert base_key != different_temp_key, (
        f"Different temperatures should produce different cache keys"
    )
    
    # Property 3: Different max_tokens produces different key
    different_tokens_key = client._generate_cache_key(
        model="test-model",
        prompt=prompt,
        temperature=temperature,
        max_tokens=4096
    )
    assert base_key != different_tokens_key, (
        f"Different max_tokens should produce different cache keys"
    )
    
    # Property 4: Different model produces different key
    different_model_key = client._generate_cache_key(
        model="different-model",
        prompt=prompt,
        temperature=temperature,
        max_tokens=2048
    )
    assert base_key != different_model_key, (
        f"Different models should produce different cache keys"
    )
    
    # Property 5: All keys should be valid cache keys
    all_keys = [
        base_key,
        different_prompt_key,
        different_temp_key,
        different_tokens_key,
        different_model_key
    ]
    
    for key in all_keys:
        assert isinstance(key, str), (
            f"All cache keys should be strings"
        )
        assert key.startswith("ai:cloudai:"), (
            f"All cache keys should have correct prefix"
        )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    system_prompt=system_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_cache_hit_returns_cached_response(prompt, system_prompt):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request, if an identical request was made 
    within the last 24 hours, the cached response should be returned 
    instead of making a new API call.
    
    This property verifies that:
    1. Cache is checked before making API call
    2. Cached response is returned when available
    3. No API call is made on cache hit
    4. Cached response includes 'cached' flag
    5. Cache hit is faster than API call
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    
    # Create mock Redis client
    mock_redis = MagicMock()
    
    # Create CloudAI client with Redis
    client = CloudAI(api_key="test-key", redis_client=mock_redis)
    
    # Mock cached response
    cached_response = {
        "success": True,
        "response": "Cached response from Redis",
        "model": "meta-llama/llama-3.1-8b-instruct:free",
        "tokens": 50,
        "latency_ms": 100
    }
    
    # Mock the cache_get function to return cached data
    with patch('app.db.redis.cache_get', new_callable=AsyncMock, return_value=cached_response):
        with patch.object(client.client, 'post', new_callable=AsyncMock) as mock_post:
            start_time = time.time()
            result = await client.llama(prompt=prompt, system_prompt=system_prompt)
            end_time = time.time()
    
    # Property 1: Result should be successful
    assert result["success"] is True, (
        f"Cached result should be successful"
    )
    
    # Property 2: Result should contain cached response
    assert result["response"] == "Cached response from Redis", (
        f"Should return cached response"
    )
    
    # Property 3: No API call should be made
    assert mock_post.call_count == 0, (
        f"Should not make API call on cache hit, made {mock_post.call_count} calls"
    )
    
    # Property 4: Result should include 'cached' flag set to True
    assert "cached" in result, (
        f"Result should include 'cached' field"
    )
    assert result["cached"] is True, (
        f"'cached' flag should be True for cache hit"
    )
    
    # Property 5: Cache hit should be fast (< 1 second)
    duration = end_time - start_time
    assert duration < 1.0, (
        f"Cache hit should be fast (< 1s), took {duration:.2f}s"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_cache_miss_makes_api_call(prompt):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request, if no cached response exists, 
    an API call should be made and the response should be cached.
    
    This property verifies that:
    1. Cache is checked first
    2. API call is made on cache miss
    3. Successful response is cached
    4. Response includes 'cached' flag set to False
    5. Cache is populated for future requests
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    
    # Create mock Redis client
    mock_redis = MagicMock()
    
    # Create CloudAI client with Redis
    client = CloudAI(api_key="test-key", redis_client=mock_redis)
    
    # Mock successful API response
    mock_api_response = MagicMock()
    mock_api_response.status_code = 200
    mock_api_response.json.return_value = {
        "choices": [{"message": {"content": "Fresh API response"}}],
        "usage": {"total_tokens": 50}
    }
    
    # Mock cache miss (returns None)
    with patch('app.db.redis.cache_get', new_callable=AsyncMock, return_value=None) as mock_cache_get:
        # Mock cache set
        with patch('app.db.redis.cache_ai_response', new_callable=AsyncMock, return_value=True) as mock_cache_set:
            with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_api_response) as mock_post:
                result = await client.llama(prompt=prompt)
    
    # Property 1: Cache should be checked
    assert mock_cache_get.call_count == 1, (
        f"Cache should be checked once, checked {mock_cache_get.call_count} times"
    )
    
    # Property 2: API call should be made on cache miss
    assert mock_post.call_count == 1, (
        f"Should make API call on cache miss, made {mock_post.call_count} calls"
    )
    
    # Property 3: Result should be successful
    assert result["success"] is True, (
        f"API call result should be successful"
    )
    
    # Property 4: Result should contain fresh response
    assert result["response"] == "Fresh API response", (
        f"Should return fresh API response"
    )
    
    # Property 5: Result should include 'cached' flag set to False
    assert "cached" in result, (
        f"Result should include 'cached' field"
    )
    assert result["cached"] is False, (
        f"'cached' flag should be False for cache miss"
    )
    
    # Property 6: Response should be cached
    assert mock_cache_set.call_count == 1, (
        f"Response should be cached, cached {mock_cache_set.call_count} times"
    )
    
    # Property 7: Cached data should match response
    cached_data = mock_cache_set.call_args[0][1]
    assert cached_data["success"] is True, (
        f"Cached data should be successful"
    )
    assert cached_data["response"] == "Fresh API response", (
        f"Cached data should match API response"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=short_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_failed_response_not_cached(prompt):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request that fails, the failed response 
    should NOT be cached.
    
    This property verifies that:
    1. Failed responses are not cached
    2. Cache is not polluted with errors
    3. Subsequent requests can retry
    4. Only successful responses are cached
    5. Cache remains clean for valid data
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    
    # Create mock Redis client
    mock_redis = MagicMock()
    
    # Create CloudAI client with Redis
    client = CloudAI(api_key="test-key", redis_client=mock_redis, max_retries=2)
    
    # Mock cache miss
    with patch('app.db.redis.cache_get', new_callable=AsyncMock, return_value=None):
        # Mock cache set
        with patch('app.db.redis.cache_ai_response', new_callable=AsyncMock) as mock_cache_set:
            # All API calls fail
            with patch.object(
                client.client,
                'post',
                new_callable=AsyncMock,
                side_effect=httpx.TimeoutException("Timeout")
            ):
                result = await client.llama(prompt=prompt)
    
    # Property 1: Request should fail
    assert result["success"] is False, (
        f"Request should fail when all retries are exhausted"
    )
    
    # Property 2: Failed response should NOT be cached
    assert mock_cache_set.call_count == 0, (
        f"Failed response should not be cached, cached {mock_cache_set.call_count} times"
    )
    
    # Property 3: Result should include error message
    assert "error" in result, (
        f"Failed result should include 'error' field"
    )
    
    # Property 4: Result should include 'cached' flag set to False
    assert "cached" in result, (
        f"Result should include 'cached' field"
    )
    assert result["cached"] is False, (
        f"'cached' flag should be False for failed request"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 20: Cloud AI Response Caching")
@settings(max_examples=5)
@given(
    prompt=prompt_strategy,
    system_prompt=system_prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_cache_works_without_redis(prompt, system_prompt):
    """
    Feature: ventureos-backend, Property 20: Cloud AI Response Caching
    
    **Validates: Requirements 6.7**
    
    Property: For any Cloud AI request, if Redis is not configured, 
    the system should work normally without caching.
    
    This property verifies that:
    1. System works without Redis client
    2. API calls are made normally
    3. No caching errors occur
    4. Response is successful
    5. Graceful degradation when caching unavailable
    """
    # Ensure we have valid inputs
    assume(len(prompt.strip()) > 0)
    
    # Create CloudAI client WITHOUT Redis
    client = CloudAI(api_key="test-key", redis_client=None)
    
    # Mock successful API response
    mock_api_response = MagicMock()
    mock_api_response.status_code = 200
    mock_api_response.json.return_value = {
        "choices": [{"message": {"content": "API response without caching"}}],
        "usage": {"total_tokens": 50}
    }
    
    with patch.object(client.client, 'post', new_callable=AsyncMock, return_value=mock_api_response) as mock_post:
        result = await client.llama(prompt=prompt, system_prompt=system_prompt)
    
    # Property 1: Request should succeed
    assert result["success"] is True, (
        f"Request should succeed without Redis"
    )
    
    # Property 2: API call should be made
    assert mock_post.call_count == 1, (
        f"Should make API call without caching, made {mock_post.call_count} calls"
    )
    
    # Property 3: Result should contain response
    assert result["response"] == "API response without caching", (
        f"Should return API response"
    )
    
    # Property 4: Result should include 'cached' flag set to False
    assert "cached" in result, (
        f"Result should include 'cached' field"
    )
    assert result["cached"] is False, (
        f"'cached' flag should be False without Redis"
    )
    
    # Property 5: No errors should occur
    assert "error" not in result, (
        f"Should not have errors when Redis is not configured"
    )
