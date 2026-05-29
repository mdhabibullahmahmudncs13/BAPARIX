"""
Property-Based Tests for Database Connections

Tests correctness properties for database connection pooling, caching,
and performance characteristics using Hypothesis for property-based testing.

**Validates: Requirements 36.1**
"""

import asyncio
import json
import os
import time
from typing import Any, Dict

import pytest
from hypothesis import given, settings, strategies as st

from app.db.redis import (
    cache_get,
    cache_set,
    get_client,
    CACHE_TTL_DEFAULT,
)

# Configure Hypothesis profiles for fast test execution
settings.register_profile("ci", max_examples=20, deadline=5000)
settings.register_profile("dev", max_examples=10, deadline=2000)
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategies for generating test data
@st.composite
def cache_key_strategy(draw):
    """Generate valid cache keys."""
    prefix = draw(st.sampled_from([
        "product:search:",
        "market:trends:",
        "shipping:calc:",
        "ai:response:",
        "test:cache:",
    ]))
    suffix = draw(st.text(
        min_size=1,
        max_size=50,
        alphabet=st.characters(
            whitelist_categories=("Lu", "Ll", "Nd"),
            whitelist_characters="-_:"
        )
    ))
    return f"{prefix}{suffix}"


@st.composite
def cache_value_strategy(draw):
    """Generate various types of cacheable values."""
    return draw(st.one_of(
        # Simple values
        st.text(min_size=1, max_size=100),  # Avoid empty strings
        st.integers(min_value=-1000000, max_value=1000000),
        st.floats(allow_nan=False, allow_infinity=False, min_value=-1000000, max_value=1000000),
        st.booleans(),
        # Complex values
        st.lists(st.integers(min_value=0, max_value=1000), min_size=1, max_size=20),
        st.dictionaries(
            keys=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=("Lu", "Ll"))),
            values=st.one_of(
                st.text(max_size=50),
                st.integers(min_value=0, max_value=1000),
                st.floats(allow_nan=False, allow_infinity=False, min_value=0, max_value=1000),
            ),
            min_size=1,
            max_size=10
        ),
    ))


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 66: Cached Response Time")
@pytest.mark.asyncio
@settings(max_examples=10)  # Keep low for fast execution as requested
@given(
    cache_key=cache_key_strategy(),
    cache_value=cache_value_strategy(),
)
async def test_cached_response_time_under_200ms(cache_key, cache_value):
    """
    Feature: ventureos-backend, Property 66: Cached Response Time
    
    **Validates: Requirements 36.1**
    
    Property: For any API request where the response is cached in Redis,
    the response time should be less than 200ms.
    
    This property verifies that:
    1. Cached data can be retrieved from Redis in under 200ms
    2. The cache retrieval time is consistent across different data types
    3. The cache retrieval time is consistent across different key patterns
    4. The caching layer provides the expected performance benefit
    
    The 200ms threshold ensures that:
    - Users with limited bandwidth get fast responses for cached data
    - The caching layer provides meaningful performance improvement
    - API responses meet the performance requirements for cached endpoints
    
    Test Strategy:
    - Generate various cache keys and values
    - Store the value in Redis cache
    - Measure the time to retrieve the cached value
    - Assert that retrieval time is under 200ms
    """
    # First, store the value in cache
    success = await cache_set(cache_key, cache_value, ttl=CACHE_TTL_DEFAULT)
    assert success, f"Failed to set cache for key: {cache_key}"
    
    # Measure cache retrieval time
    start_time = time.perf_counter()
    retrieved_value = await cache_get(cache_key)
    end_time = time.perf_counter()
    
    # Calculate elapsed time in milliseconds
    elapsed_ms = (end_time - start_time) * 1000
    
    # Property: Cached response time must be under 200ms
    assert elapsed_ms < 200, (
        f"Cached response time {elapsed_ms:.2f}ms exceeds 200ms threshold. "
        f"Key: {cache_key}, Value type: {type(cache_value).__name__}"
    )
    
    # Verify the retrieved value matches what was stored
    assert retrieved_value == cache_value, (
        f"Retrieved value does not match stored value. "
        f"Expected: {cache_value}, Got: {retrieved_value}"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 66: Cached Response Time - Multiple Retrievals")
@pytest.mark.asyncio
@settings(max_examples=5)  # Keep low for fast execution
@given(
    cache_key=cache_key_strategy(),
    cache_value=cache_value_strategy(),
    num_retrievals=st.integers(min_value=2, max_value=5),
)
async def test_cached_response_time_consistent_across_retrievals(
    cache_key, cache_value, num_retrievals
):
    """
    Feature: ventureos-backend, Property 66: Cached Response Time - Multiple Retrievals
    
    **Validates: Requirements 36.1**
    
    Property: Cached response time should remain under 200ms even when
    the same cached value is retrieved multiple times in succession.
    
    This ensures that:
    - Cache performance is consistent
    - Connection pooling works correctly
    - No performance degradation occurs with repeated access
    """
    # Store the value in cache
    success = await cache_set(cache_key, cache_value, ttl=CACHE_TTL_DEFAULT)
    assert success, f"Failed to set cache for key: {cache_key}"
    
    # Perform multiple retrievals and measure each
    retrieval_times = []
    for i in range(num_retrievals):
        start_time = time.perf_counter()
        retrieved_value = await cache_get(cache_key)
        end_time = time.perf_counter()
        
        elapsed_ms = (end_time - start_time) * 1000
        retrieval_times.append(elapsed_ms)
        
        # Each retrieval must be under 200ms
        assert elapsed_ms < 200, (
            f"Retrieval {i+1}/{num_retrievals} took {elapsed_ms:.2f}ms, exceeds 200ms threshold. "
            f"Key: {cache_key}"
        )
        
        # Verify correctness
        assert retrieved_value == cache_value, (
            f"Retrieval {i+1} returned incorrect value"
        )
    
    # Calculate statistics
    avg_time = sum(retrieval_times) / len(retrieval_times)
    max_time = max(retrieval_times)
    
    # All retrievals should be fast
    assert max_time < 200, (
        f"Maximum retrieval time {max_time:.2f}ms exceeds 200ms. "
        f"Average: {avg_time:.2f}ms, All times: {[f'{t:.2f}' for t in retrieval_times]}"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 66: Cached Response Time - Large Values")
@pytest.mark.asyncio
@settings(max_examples=5)  # Keep low for fast execution
@given(
    cache_key=cache_key_strategy(),
    # Generate larger, more realistic cached data structures
    num_items=st.integers(min_value=10, max_value=50),
)
async def test_cached_response_time_with_realistic_data(
    cache_key, num_items
):
    """
    Feature: ventureos-backend, Property 66: Cached Response Time - Large Values
    
    **Validates: Requirements 36.1**
    
    Property: Cached response time should remain under 200ms even for
    larger, more realistic cached data structures like product search results
    or market trend data.
    
    This ensures that the 200ms threshold is achievable for real-world
    API responses, not just small test values.
    """
    # Generate a realistic cached response structure
    # (similar to product search results or market trends)
    cache_value = {
        "success": True,
        "data": [
            {
                "id": f"item_{i}",
                "title": f"Product Title {i}",
                "description": f"Product description for item {i} with some details",
                "price": 100.0 + i * 10,
                "category": "electronics",
                "platform": "alibaba",
                "rating": 4.5,
                "moq": 100,
                "tags": ["tag1", "tag2", "tag3"],
            }
            for i in range(num_items)
        ],
        "meta": {
            "page": 1,
            "page_size": num_items,
            "total": num_items,
            "has_more": False,
        },
        "timestamp": "2024-01-15T10:30:00Z",
    }
    
    # Store the realistic data in cache
    success = await cache_set(cache_key, cache_value, ttl=CACHE_TTL_DEFAULT)
    assert success, f"Failed to set cache for key: {cache_key}"
    
    # Measure cache retrieval time
    start_time = time.perf_counter()
    retrieved_value = await cache_get(cache_key)
    end_time = time.perf_counter()
    
    elapsed_ms = (end_time - start_time) * 1000
    
    # Property: Even with realistic data sizes, retrieval must be under 200ms
    assert elapsed_ms < 200, (
        f"Cached response time {elapsed_ms:.2f}ms exceeds 200ms threshold "
        f"for realistic data with {num_items} items. "
        f"Data size: ~{len(json.dumps(cache_value))} bytes"
    )
    
    # Verify data integrity
    assert retrieved_value == cache_value, "Retrieved data does not match stored data"
    assert len(retrieved_value["data"]) == num_items, "Retrieved data has incorrect number of items"


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 66: Cached Response Time - Concurrent Access")
@pytest.mark.asyncio
@settings(max_examples=3)  # Keep very low for fast execution
@given(
    cache_key=cache_key_strategy(),
    cache_value=cache_value_strategy(),
    num_concurrent=st.integers(min_value=2, max_value=5),
)
async def test_cached_response_time_under_concurrent_load(
    cache_key, cache_value, num_concurrent
):
    """
    Feature: ventureos-backend, Property 66: Cached Response Time - Concurrent Access
    
    **Validates: Requirements 36.1**
    
    Property: Cached response time should remain under 200ms even when
    multiple concurrent requests access the same cached value.
    
    This ensures that:
    - Connection pooling handles concurrent access efficiently
    - Cache performance doesn't degrade under load
    - The 200ms threshold is maintained in realistic usage scenarios
    """
    # Store the value in cache
    success = await cache_set(cache_key, cache_value, ttl=CACHE_TTL_DEFAULT)
    assert success, f"Failed to set cache for key: {cache_key}"
    
    # Define async function to retrieve and measure time
    async def retrieve_and_measure():
        start_time = time.perf_counter()
        retrieved = await cache_get(cache_key)
        end_time = time.perf_counter()
        elapsed_ms = (end_time - start_time) * 1000
        return elapsed_ms, retrieved
    
    # Execute concurrent retrievals
    tasks = [retrieve_and_measure() for _ in range(num_concurrent)]
    results = await asyncio.gather(*tasks)
    
    # Verify all concurrent retrievals met the performance requirement
    for i, (elapsed_ms, retrieved_value) in enumerate(results):
        assert elapsed_ms < 200, (
            f"Concurrent retrieval {i+1}/{num_concurrent} took {elapsed_ms:.2f}ms, "
            f"exceeds 200ms threshold. Key: {cache_key}"
        )
        
        assert retrieved_value == cache_value, (
            f"Concurrent retrieval {i+1} returned incorrect value"
        )
    
    # Calculate statistics
    times = [elapsed_ms for elapsed_ms, _ in results]
    avg_time = sum(times) / len(times)
    max_time = max(times)
    
    # Report performance metrics
    assert max_time < 200, (
        f"Maximum concurrent retrieval time {max_time:.2f}ms exceeds 200ms. "
        f"Average: {avg_time:.2f}ms, Concurrent requests: {num_concurrent}"
    )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 66: Cached Response Time - Different Cache Types")
@pytest.mark.asyncio
@settings(max_examples=5)  # Keep low for fast execution
@given(
    cache_type=st.sampled_from([
        "product_search",
        "market_trends",
        "shipping_calc",
        "ai_response",
    ]),
    identifier=st.text(min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"))),
)
async def test_cached_response_time_across_cache_types(
    cache_type, identifier
):
    """
    Feature: ventureos-backend, Property 66: Cached Response Time - Different Cache Types
    
    **Validates: Requirements 36.1**
    
    Property: The 200ms cached response time requirement should hold
    across all different types of cached data (product search, market trends,
    shipping calculations, AI responses).
    
    This ensures consistent performance across all cached API endpoints.
    """
    # Generate cache key based on type
    cache_key = f"{cache_type}:{identifier}"
    
    # Generate realistic cache value based on type
    if cache_type == "product_search":
        cache_value = {
            "success": True,
            "data": [
                {"id": f"prod_{i}", "title": f"Product {i}", "price": 100 + i}
                for i in range(10)
            ],
            "meta": {"page": 1, "total": 10},
        }
    elif cache_type == "market_trends":
        cache_value = {
            "success": True,
            "data": [
                {
                    "trend_name": f"Trend {i}",
                    "trajectory": "rising",
                    "search_volume": 1000 + i * 100,
                }
                for i in range(5)
            ],
        }
    elif cache_type == "shipping_calc":
        cache_value = {
            "success": True,
            "data": {
                "shipping_cost": 250.0,
                "customs_duty": 150.0,
                "total_landed_cost": 1400.0,
                "lead_time": "7-14 days",
            },
        }
    else:  # ai_response
        cache_value = {
            "response": "This is a cached AI response with some content.",
            "model": "qwen2.5:7b",
            "tokens": 50,
        }
    
    # Store in cache
    success = await cache_set(cache_key, cache_value, ttl=CACHE_TTL_DEFAULT)
    assert success, f"Failed to set cache for key: {cache_key}"
    
    # Measure retrieval time
    start_time = time.perf_counter()
    retrieved_value = await cache_get(cache_key)
    end_time = time.perf_counter()
    
    elapsed_ms = (end_time - start_time) * 1000
    
    # Property: All cache types must meet the 200ms requirement
    assert elapsed_ms < 200, (
        f"Cached response time {elapsed_ms:.2f}ms exceeds 200ms threshold "
        f"for cache type '{cache_type}'. Key: {cache_key}"
    )
    
    # Verify data integrity
    assert retrieved_value == cache_value, (
        f"Retrieved value does not match for cache type '{cache_type}'"
    )
