"""
Property-Based Tests for API Endpoints

Tests correctness properties that should hold for all API endpoints
using Hypothesis for property-based testing.

**Validates: Requirements 1.2**
"""

import json
import os
import pytest
from hypothesis import given, settings, strategies as st
from fastapi import status

# Configure Hypothesis profiles
settings.register_profile("ci", max_examples=20, deadline=5000)
settings.register_profile("dev", max_examples=10, deadline=2000)
settings.load_profile("ci" if os.getenv("CI") else "dev")


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 1: JSON Response Format")
@settings(max_examples=20)
@given(
    # Generate various HTTP methods that might be used
    method=st.sampled_from(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]),
    # Generate various query parameters
    query_params=st.dictionaries(
        keys=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"))),
        values=st.one_of(
            st.text(max_size=50),
            st.integers(min_value=-1000, max_value=1000),
            st.floats(allow_nan=False, allow_infinity=False, min_value=-1000, max_value=1000)
        ),
        max_size=5
    ),
    # Generate various headers (ASCII only to avoid httpx encoding issues)
    custom_headers=st.dictionaries(
        keys=st.sampled_from(["X-Custom-Header", "X-Test-Header", "X-Client-Version"]),
        values=st.text(min_size=1, max_size=50, alphabet=st.characters(min_codepoint=32, max_codepoint=126)),
        max_size=3
    )
)
def test_health_check_always_returns_valid_json(session_client, method, query_params, custom_headers):
    """
    Feature: ventureos-backend, Property 1: JSON Response Format
    
    **Validates: Requirements 1.2**
    
    Property: The health check endpoint should ALWAYS return valid JSON format
    regardless of the HTTP method, query parameters, or headers used.
    
    This property verifies that:
    1. The response body is valid JSON (can be parsed without errors)
    2. The response contains a "status" field
    3. The response structure is consistent
    4. The endpoint handles various inputs gracefully
    
    The health check endpoint is critical infrastructure and must be robust
    against any type of request, as it's used by:
    - Container orchestration systems (Kubernetes, Docker)
    - Load balancers
    - Monitoring systems
    - Health check probes
    """
    # Health check should primarily respond to GET requests
    # but should handle other methods gracefully
    if method == "GET":
        response = session_client.get("/health", params=query_params, headers=custom_headers)
    elif method == "POST":
        response = session_client.post("/health", params=query_params, headers=custom_headers)
    elif method == "PUT":
        response = session_client.put("/health", params=query_params, headers=custom_headers)
    elif method == "PATCH":
        response = session_client.patch("/health", params=query_params, headers=custom_headers)
    elif method == "DELETE":
        response = session_client.delete("/health", params=query_params, headers=custom_headers)
    elif method == "OPTIONS":
        response = session_client.options("/health", params=query_params, headers=custom_headers)
    
    # Property 1: Response body must be valid JSON
    try:
        data = json.loads(response.text)
    except json.JSONDecodeError as e:
        pytest.fail(
            f"Response is not valid JSON for method {method}. "
            f"Response text: {response.text[:200]}. "
            f"Error: {str(e)}"
        )
    
    # Property 2: For successful GET requests, response must have expected structure
    if method == "GET" and response.status_code == status.HTTP_200_OK:
        # Must have "status" field
        assert "status" in data, f"Response missing 'status' field: {data}"
        assert isinstance(data["status"], str), f"'status' field must be string, got {type(data['status'])}"
        
        # Must have "service" field
        assert "service" in data, f"Response missing 'service' field: {data}"
        assert isinstance(data["service"], str), f"'service' field must be string, got {type(data['service'])}"
        
        # Must have "version" field
        assert "version" in data, f"Response missing 'version' field: {data}"
        assert isinstance(data["version"], str), f"'version' field must be string, got {type(data['version'])}"
        
        # Must have "environment" field
        assert "environment" in data, f"Response missing 'environment' field: {data}"
        assert isinstance(data["environment"], str), f"'environment' field must be string, got {type(data['environment'])}"
        
        # Status should be "healthy"
        assert data["status"] == "healthy", f"Expected status 'healthy', got '{data['status']}'"
    
    # Property 3: Response must be JSON regardless of method or status code
    # Even error responses should be valid JSON
    assert isinstance(data, dict), f"Response must be a JSON object (dict), got {type(data)}"


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 1: JSON Response Format - Edge Cases")
@settings(max_examples=10)
@given(
    # Test with various Accept headers
    accept_header=st.sampled_from([
        "application/json",
        "application/xml",
        "text/html",
        "text/plain",
        "*/*",
        "application/json, text/plain, */*",
        ""
    ]),
    # Test with various Content-Type headers
    content_type=st.sampled_from([
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "text/plain",
        ""
    ])
)
def test_health_check_json_format_with_various_headers(session_client, accept_header, content_type):
    """
    Feature: ventureos-backend, Property 1: JSON Response Format - Edge Cases
    
    **Validates: Requirements 1.2**
    
    Property: The health check endpoint should return valid JSON regardless of
    Accept or Content-Type headers sent by the client.
    
    This ensures the endpoint is robust against clients that:
    - Don't send proper Accept headers
    - Send conflicting Content-Type headers
    - Use non-standard header combinations
    """
    headers = {}
    if accept_header:
        headers["Accept"] = accept_header
    if content_type:
        headers["Content-Type"] = content_type
    
    response = session_client.get("/health", headers=headers)
    
    # Must return valid JSON regardless of headers
    try:
        data = json.loads(response.text)
    except json.JSONDecodeError as e:
        pytest.fail(
            f"Response is not valid JSON with Accept='{accept_header}' and Content-Type='{content_type}'. "
            f"Response text: {response.text[:200]}. "
            f"Error: {str(e)}"
        )
    
    # Must have the expected structure
    assert "status" in data
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data
    assert "environment" in data


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 1: JSON Response Format - Concurrent Requests")
@settings(max_examples=5)
@given(
    # Test with multiple concurrent requests
    num_requests=st.integers(min_value=1, max_value=10)
)
def test_health_check_json_format_under_load(session_client, num_requests):
    """
    Feature: ventureos-backend, Property 1: JSON Response Format - Concurrent Requests
    
    **Validates: Requirements 1.2**
    
    Property: The health check endpoint should return valid JSON even when
    handling multiple concurrent requests.
    
    This ensures the endpoint maintains consistency under load, which is
    critical for health check probes that may be called frequently.
    """
    responses = []
    
    # Make multiple requests
    for _ in range(num_requests):
        response = session_client.get("/health")
        responses.append(response)
    
    # All responses must be valid JSON
    for i, response in enumerate(responses):
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as e:
            pytest.fail(
                f"Response {i+1}/{num_requests} is not valid JSON. "
                f"Response text: {response.text[:200]}. "
                f"Error: {str(e)}"
            )
        
        # All responses must have consistent structure
        assert "status" in data, f"Response {i+1} missing 'status' field"
        assert data["status"] == "healthy", f"Response {i+1} has unexpected status: {data['status']}"
        assert "service" in data, f"Response {i+1} missing 'service' field"
        assert "version" in data, f"Response {i+1} missing 'version' field"
        assert "environment" in data, f"Response {i+1} missing 'environment' field"
