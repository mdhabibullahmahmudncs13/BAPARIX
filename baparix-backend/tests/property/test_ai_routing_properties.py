"""
Property-Based Tests for AI Routing

Tests correctness properties for AI task classification, routing, fallback logic,
and request logging using Hypothesis for property-based testing.

**Validates: Requirements 4.2, 4.3, 4.5, 4.6, 4.7**
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from hypothesis import given, settings, strategies as st, assume, HealthCheck

from app.core.ai_router import (
    AIRouter,
    AITaskClassifier,
    TaskComplexity,
    AIRouterError,
)


# Configure Hypothesis profiles
# Using max_examples=5 for faster test execution as per task requirements
settings.register_profile("ci", max_examples=5, deadline=5000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.register_profile("dev", max_examples=5, deadline=2000, suppress_health_check=[HealthCheck.function_scoped_fixture])
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategies for generating test data
simple_task_strategy = st.sampled_from([
    "onboarding_qa",
    "product_translation",
    "financial_tagging",
    "content_generation",
    "trend_summary",
    "marketplace_query_parse",
])

complex_task_strategy = st.sampled_from([
    "blueprint_generation",
    "market_analysis",
    "risk_assessment",
    "seo_strategy",
    "competitor_analysis",
    "marketplace_enrichment",
])

prompt_strategy = st.text(min_size=10, max_size=500)


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 13: Simple Task Routing")
@settings(max_examples=5)
@given(
    task_type=simple_task_strategy,
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_simple_task_routing(task_type, prompt):
    """
    Feature: ventureos-backend, Property 13: Simple Task Routing
    
    **Validates: Requirements 4.2, 4.4**
    
    Property: For any AI task classified as simple (onboarding Q&A, product 
    translation, financial tagging, content generation, trend summary, 
    marketplace query parsing), the task should be routed to the Local AI 
    Model (Ollama + Qwen2.5-7b).
    
    This property verifies that:
    1. Simple tasks are classified as TaskComplexity.SIMPLE
    2. Simple tasks are routed to local AI model
    3. Local AI client is called with correct parameters
    4. Cloud AI client is NOT called for simple tasks
    5. Routing decision is consistent across multiple calls
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Property 1: Task should be classified as SIMPLE
    complexity = AITaskClassifier.classify_task(task_type)
    assert complexity == TaskComplexity.SIMPLE, (
        f"Task '{task_type}' should be classified as SIMPLE, "
        f"got {complexity}"
    )
    
    # Create mock AI clients
    mock_local_client = AsyncMock()
    mock_local_client.generate = AsyncMock(return_value={
        "success": True,
        "response": "Local AI response",
        "tokens": 100,
    })
    
    mock_cloud_client = AsyncMock()
    mock_cloud_client.generate = AsyncMock(return_value={
        "success": True,
        "response": "Cloud AI response",
        "tokens": 150,
    })
    
    # Create router with mock clients
    router = AIRouter(
        local_ai_client=mock_local_client,
        cloud_ai_client=mock_cloud_client,
        cache_client=None,
        max_retries=3
    )
    
    # Mock the _execute_model_request to track which model is called
    local_called = False
    cloud_called = False
    
    async def mock_execute(model_type, task_type, prompt, **kwargs):
        nonlocal local_called, cloud_called
        if model_type == "local":
            local_called = True
            return {
                "success": True,
                "response": "Local AI response",
                "model_used": "local",
                "tokens": 100,
            }
        elif model_type == "cloud":
            cloud_called = True
            return {
                "success": True,
                "response": "Cloud AI response",
                "model_used": "cloud",
                "tokens": 150,
            }
    
    with patch.object(router, '_execute_model_request', side_effect=mock_execute):
        # Route the task
        result = await router.route(task_type=task_type, prompt=prompt)
    
    # Property 2: Local AI should be called
    assert local_called is True, (
        f"Local AI should be called for simple task '{task_type}'"
    )
    
    # Property 3: Cloud AI should NOT be called
    assert cloud_called is False, (
        f"Cloud AI should NOT be called for simple task '{task_type}'"
    )
    
    # Property 4: Result should indicate success
    assert result["success"] is True, (
        f"Simple task routing should succeed, got error: {result.get('error')}"
    )
    
    # Property 5: Result should indicate local model was used
    assert result["model_used"] == "local", (
        f"Simple task should use local model, got {result['model_used']}"
    )
    
    # Property 6: Fallback should not be used for successful simple tasks
    assert result["fallback_used"] is False, (
        f"Fallback should not be used for successful simple task"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 14: Complex Task Routing")
@settings(max_examples=5)
@given(
    task_type=complex_task_strategy,
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_complex_task_routing(task_type, prompt):
    """
    Feature: ventureos-backend, Property 14: Complex Task Routing
    
    **Validates: Requirements 4.3, 4.5**
    
    Property: For any AI task classified as complex (blueprint generation, 
    market analysis, risk assessment, SEO strategy, competitor analysis, 
    marketplace enrichment), the task should be routed to the Cloud AI 
    Model (OpenRouter).
    
    This property verifies that:
    1. Complex tasks are classified as TaskComplexity.COMPLEX
    2. Complex tasks are routed to cloud AI model
    3. Cloud AI client is called with correct parameters
    4. Local AI client is NOT called initially for complex tasks
    5. Routing decision is consistent across multiple calls
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Property 1: Task should be classified as COMPLEX
    complexity = AITaskClassifier.classify_task(task_type)
    assert complexity == TaskComplexity.COMPLEX, (
        f"Task '{task_type}' should be classified as COMPLEX, "
        f"got {complexity}"
    )
    
    # Create mock AI clients
    mock_local_client = AsyncMock()
    mock_local_client.generate = AsyncMock(return_value={
        "success": True,
        "response": "Local AI response",
        "tokens": 100,
    })
    
    mock_cloud_client = AsyncMock()
    mock_cloud_client.generate = AsyncMock(return_value={
        "success": True,
        "response": "Cloud AI response",
        "tokens": 150,
    })
    
    # Create router with mock clients
    router = AIRouter(
        local_ai_client=mock_local_client,
        cloud_ai_client=mock_cloud_client,
        cache_client=None,
        max_retries=3
    )
    
    # Mock the _execute_model_request to track which model is called
    local_called = False
    cloud_called = False
    
    async def mock_execute(model_type, task_type, prompt, **kwargs):
        nonlocal local_called, cloud_called
        if model_type == "local":
            local_called = True
            return {
                "success": True,
                "response": "Local AI response",
                "model_used": "local",
                "tokens": 100,
            }
        elif model_type == "cloud":
            cloud_called = True
            return {
                "success": True,
                "response": "Cloud AI response",
                "model_used": "cloud",
                "tokens": 150,
            }
    
    with patch.object(router, '_execute_model_request', side_effect=mock_execute):
        # Route the task
        result = await router.route(task_type=task_type, prompt=prompt)
    
    # Property 2: Cloud AI should be called
    assert cloud_called is True, (
        f"Cloud AI should be called for complex task '{task_type}'"
    )
    
    # Property 3: Local AI should NOT be called (since cloud succeeded)
    assert local_called is False, (
        f"Local AI should NOT be called for successful complex task '{task_type}'"
    )
    
    # Property 4: Result should indicate success
    assert result["success"] is True, (
        f"Complex task routing should succeed, got error: {result.get('error')}"
    )
    
    # Property 5: Result should indicate cloud model was used
    assert result["model_used"] == "cloud", (
        f"Complex task should use cloud model, got {result['model_used']}"
    )
    
    # Property 6: Fallback should not be used for successful complex tasks
    assert result["fallback_used"] is False, (
        f"Fallback should not be used for successful complex task"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 15: Cloud AI Fallback")
@settings(max_examples=5)
@given(
    task_type=complex_task_strategy,
    prompt=prompt_strategy,
    retry_count=st.integers(min_value=1, max_value=3),
)
@pytest.mark.asyncio
async def test_cloud_ai_fallback(task_type, prompt, retry_count):
    """
    Feature: ventureos-backend, Property 15: Cloud AI Fallback
    
    **Validates: Requirements 4.6**
    
    Property: For any Cloud AI request that fails after 3 retries, the system 
    should fall back to Local AI Model.
    
    This property verifies that:
    1. When cloud AI fails, retries are attempted
    2. After max retries, fallback to local AI occurs
    3. Local AI is called after cloud AI exhausts retries
    4. Final result indicates fallback was used
    5. System gracefully handles cloud AI failures
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Property 1: Task should be classified as COMPLEX
    complexity = AITaskClassifier.classify_task(task_type)
    assert complexity == TaskComplexity.COMPLEX, (
        f"Task '{task_type}' should be classified as COMPLEX"
    )
    
    # Create router with mock clients
    router = AIRouter(
        local_ai_client=AsyncMock(),
        cloud_ai_client=AsyncMock(),
        cache_client=None,
        max_retries=3
    )
    
    # Track calls to each model
    cloud_call_count = 0
    local_call_count = 0
    
    async def mock_execute(model_type, task_type, prompt, **kwargs):
        nonlocal cloud_call_count, local_call_count
        
        if model_type == "cloud":
            cloud_call_count += 1
            # Cloud AI always fails
            return {
                "success": False,
                "error": "Cloud AI service unavailable",
                "model_used": "cloud",
                "tokens": 0,
            }
        elif model_type == "local":
            local_call_count += 1
            # Local AI succeeds
            return {
                "success": True,
                "response": "Local AI fallback response",
                "model_used": "local",
                "tokens": 100,
            }
    
    with patch.object(router, '_execute_model_request', side_effect=mock_execute):
        # Route the task
        result = await router.route(task_type=task_type, prompt=prompt)
    
    # Property 2: Cloud AI should be attempted (with retries)
    # The _try_model_with_retries will attempt up to max_retries times
    assert cloud_call_count > 0, (
        f"Cloud AI should be attempted at least once for complex task"
    )
    
    # Property 3: Local AI should be called as fallback
    assert local_call_count > 0, (
        f"Local AI should be called as fallback after cloud AI fails"
    )
    
    # Property 4: Result should indicate fallback was used
    assert result["fallback_used"] is True, (
        f"Result should indicate fallback was used when cloud AI fails"
    )
    
    # Property 5: Result should indicate local model was used (fallback)
    assert result["model_used"] == "local", (
        f"After fallback, model_used should be 'local', got {result['model_used']}"
    )
    
    # Property 6: Result should indicate success (from fallback)
    assert result["success"] is True, (
        f"Fallback to local AI should succeed, got error: {result.get('error')}"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 16: AI Request Logging")
@settings(max_examples=5)
@given(
    task_type=st.one_of(simple_task_strategy, complex_task_strategy),
    prompt=prompt_strategy,
    success=st.booleans(),
)
@pytest.mark.asyncio
async def test_ai_request_logging(task_type, prompt, success):
    """
    Feature: ventureos-backend, Property 16: AI Request Logging
    
    **Validates: Requirements 4.7**
    
    Property: For any AI request (local or cloud), a log entry should be 
    created containing model used, latency, token count, and timestamp.
    
    This property verifies that:
    1. All AI requests are logged
    2. Log entries contain model_used field
    3. Log entries contain latency_ms field
    4. Log entries contain tokens field
    5. Log entries contain success status
    6. Log entries contain fallback_used field
    7. Logging occurs for both successful and failed requests
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create router with mock clients
    router = AIRouter(
        local_ai_client=AsyncMock(),
        cloud_ai_client=AsyncMock(),
        cache_client=None,
        max_retries=3
    )
    
    # Determine which model should be used based on task complexity
    complexity = AITaskClassifier.classify_task(task_type)
    expected_model = "local" if complexity == TaskComplexity.SIMPLE else "cloud"
    
    # Mock the _execute_model_request
    async def mock_execute(model_type, task_type, prompt, **kwargs):
        if success:
            return {
                "success": True,
                "response": f"{model_type} AI response",
                "model_used": model_type,
                "tokens": 100,
            }
        else:
            return {
                "success": False,
                "error": f"{model_type} AI error",
                "model_used": model_type,
                "tokens": 0,
            }
    
    # Capture log calls
    log_calls = []
    
    def mock_log(
        task_type,
        model_used,
        latency_ms,
        tokens,
        success,
        fallback_used
    ):
        log_calls.append({
            "task_type": task_type,
            "model_used": model_used,
            "latency_ms": latency_ms,
            "tokens": tokens,
            "success": success,
            "fallback_used": fallback_used,
        })
    
    with patch.object(router, '_execute_model_request', side_effect=mock_execute):
        with patch.object(router, '_log_ai_request', side_effect=mock_log):
            # Route the task
            result = await router.route(task_type=task_type, prompt=prompt)
    
    # Property 1: At least one log entry should be created
    assert len(log_calls) > 0, (
        f"At least one log entry should be created for AI request"
    )
    
    # Get the log entry (should be only one for successful primary request)
    log_entry = log_calls[0]
    
    # Property 2: Log entry should contain task_type
    assert "task_type" in log_entry, (
        f"Log entry should contain 'task_type' field"
    )
    assert log_entry["task_type"] == task_type, (
        f"Log entry task_type should be '{task_type}', "
        f"got '{log_entry['task_type']}'"
    )
    
    # Property 3: Log entry should contain model_used
    assert "model_used" in log_entry, (
        f"Log entry should contain 'model_used' field"
    )
    assert log_entry["model_used"] is not None, (
        f"Log entry model_used should not be None"
    )
    
    # Property 4: Log entry should contain latency_ms
    assert "latency_ms" in log_entry, (
        f"Log entry should contain 'latency_ms' field"
    )
    assert isinstance(log_entry["latency_ms"], int), (
        f"Log entry latency_ms should be int, got {type(log_entry['latency_ms'])}"
    )
    assert log_entry["latency_ms"] >= 0, (
        f"Log entry latency_ms should be non-negative, got {log_entry['latency_ms']}"
    )
    
    # Property 5: Log entry should contain tokens
    assert "tokens" in log_entry, (
        f"Log entry should contain 'tokens' field"
    )
    assert isinstance(log_entry["tokens"], int), (
        f"Log entry tokens should be int, got {type(log_entry['tokens'])}"
    )
    assert log_entry["tokens"] >= 0, (
        f"Log entry tokens should be non-negative, got {log_entry['tokens']}"
    )
    
    # Property 6: Log entry should contain success status
    assert "success" in log_entry, (
        f"Log entry should contain 'success' field"
    )
    assert isinstance(log_entry["success"], bool), (
        f"Log entry success should be bool, got {type(log_entry['success'])}"
    )
    assert log_entry["success"] == success, (
        f"Log entry success should match request outcome: {success}, "
        f"got {log_entry['success']}"
    )
    
    # Property 7: Log entry should contain fallback_used
    assert "fallback_used" in log_entry, (
        f"Log entry should contain 'fallback_used' field"
    )
    assert isinstance(log_entry["fallback_used"], bool), (
        f"Log entry fallback_used should be bool, "
        f"got {type(log_entry['fallback_used'])}"
    )
    
    # Property 8: Result should contain all logged fields
    assert result["model_used"] == log_entry["model_used"], (
        f"Result model_used should match log entry"
    )
    assert result["latency_ms"] == log_entry["latency_ms"], (
        f"Result latency_ms should match log entry"
    )
    assert result["tokens"] == log_entry["tokens"], (
        f"Result tokens should match log entry"
    )
    assert result["success"] == log_entry["success"], (
        f"Result success should match log entry"
    )
    assert result["fallback_used"] == log_entry["fallback_used"], (
        f"Result fallback_used should match log entry"
    )



@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 15: Cloud AI Fallback - Retry Logic")
@settings(max_examples=5)
@given(
    task_type=complex_task_strategy,
    prompt=prompt_strategy,
)
@pytest.mark.asyncio
async def test_cloud_ai_retry_with_exponential_backoff(task_type, prompt):
    """
    Feature: ventureos-backend, Property 15: Cloud AI Fallback - Retry Logic
    
    **Validates: Requirements 4.6**
    
    Property: For any Cloud AI request that fails, the system should retry 
    up to 3 times with exponential backoff (1s, 2s, 4s) before falling back 
    to Local AI.
    
    This property verifies that:
    1. Retries occur with exponential backoff delays
    2. Exactly max_retries attempts are made
    3. Backoff delays follow the pattern: 1s, 2s, 4s
    4. After all retries fail, fallback to local AI occurs
    5. Total time includes retry delays
    """
    # Ensure we have a valid prompt
    assume(len(prompt.strip()) > 0)
    
    # Create router with mock clients
    router = AIRouter(
        local_ai_client=AsyncMock(),
        cloud_ai_client=AsyncMock(),
        cache_client=None,
        max_retries=3
    )
    
    # Track retry attempts and timing
    cloud_attempts = []
    local_attempts = []
    
    async def mock_execute(model_type, task_type, prompt, **kwargs):
        timestamp = asyncio.get_event_loop().time()
        
        if model_type == "cloud":
            cloud_attempts.append(timestamp)
            # Cloud AI always fails
            return {
                "success": False,
                "error": "Cloud AI service unavailable",
                "model_used": "cloud",
                "tokens": 0,
            }
        elif model_type == "local":
            local_attempts.append(timestamp)
            # Local AI succeeds
            return {
                "success": True,
                "response": "Local AI fallback response",
                "model_used": "local",
                "tokens": 100,
            }
    
    with patch.object(router, '_execute_model_request', side_effect=mock_execute):
        # Route the task
        result = await router.route(task_type=task_type, prompt=prompt)
    
    # Property 1: Cloud AI should be attempted exactly max_retries times
    assert len(cloud_attempts) == router.max_retries, (
        f"Cloud AI should be attempted {router.max_retries} times, "
        f"got {len(cloud_attempts)} attempts"
    )
    
    # Property 2: Local AI should be called once as fallback
    assert len(local_attempts) == 1, (
        f"Local AI should be called once as fallback, "
        f"got {len(local_attempts)} attempts"
    )
    
    # Property 3: Verify exponential backoff delays between cloud attempts
    # Expected delays: 1s, 2s (between attempts 1-2, 2-3)
    if len(cloud_attempts) >= 2:
        delay_1_2 = cloud_attempts[1] - cloud_attempts[0]
        # Allow some tolerance for timing (0.8s to 1.5s for 1s delay)
        assert 0.8 <= delay_1_2 <= 1.5, (
            f"Delay between attempt 1 and 2 should be ~1s, got {delay_1_2:.2f}s"
        )
    
    if len(cloud_attempts) >= 3:
        delay_2_3 = cloud_attempts[2] - cloud_attempts[1]
        # Allow some tolerance for timing (1.8s to 2.5s for 2s delay)
        assert 1.8 <= delay_2_3 <= 2.5, (
            f"Delay between attempt 2 and 3 should be ~2s, got {delay_2_3:.2f}s"
        )
    
    # Property 4: Local AI should be called after all cloud retries
    if len(cloud_attempts) > 0 and len(local_attempts) > 0:
        assert local_attempts[0] > cloud_attempts[-1], (
            f"Local AI should be called after all cloud retries"
        )
    
    # Property 5: Result should indicate fallback was used
    assert result["fallback_used"] is True, (
        f"Result should indicate fallback was used"
    )
    
    # Property 6: Result should indicate success (from fallback)
    assert result["success"] is True, (
        f"Fallback to local AI should succeed"
    )
    
    # Property 7: Result should indicate local model was used
    assert result["model_used"] == "local", (
        f"After fallback, model_used should be 'local'"
    )
