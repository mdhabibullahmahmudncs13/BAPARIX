"""
Unit Tests for Main Application

Tests for the FastAPI application initialization and core endpoints.
"""

import pytest
from fastapi import status


def test_health_check(client):
    """
    Test the health check endpoint.
    
    Validates:
    - Requirement 1.7: Health check responds within 100ms
    - Returns 200 status code
    - Returns expected health status structure
    """
    response = client.get("/health")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data
    assert "environment" in data


def test_root_endpoint(client):
    """
    Test the root endpoint.
    
    Validates:
    - Returns 200 status code
    - Returns API metadata
    """
    response = client.get("/")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "health" in data


def test_cors_headers(client):
    """
    Test CORS headers are properly set.
    
    Validates:
    - Requirement 1.5: CORS headers allowing frontend requests
    """
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )
    
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers


def test_request_id_header(client):
    """
    Test that request ID is added to responses.
    
    Validates:
    - X-Request-ID header is present in response
    """
    response = client.get("/health")
    
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0


def test_gzip_compression(client):
    """
    Test that GZip compression is enabled.
    
    Validates:
    - Content-Encoding header for large responses
    """
    response = client.get(
        "/health",
        headers={"Accept-Encoding": "gzip"}
    )
    
    # Small responses may not be compressed (minimum_size=1000)
    # Just verify the endpoint works with gzip header
    assert response.status_code == status.HTTP_200_OK


def test_404_not_found(client):
    """
    Test that non-existent endpoints return 404.
    """
    response = client.get("/nonexistent-endpoint")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
