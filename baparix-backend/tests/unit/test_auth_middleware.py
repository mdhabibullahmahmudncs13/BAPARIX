"""
Unit Tests for Authentication Middleware

Tests JWT token extraction, validation, and request processing
for the authentication middleware.
"""

import jwt
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.config import settings
from app.core.auth import create_internal_jwt_token
from app.middleware.auth import AuthMiddleware


# Create test FastAPI app with middleware
@pytest.fixture
def app():
    """Create FastAPI app with AuthMiddleware for testing."""
    test_app = FastAPI()
    test_app.add_middleware(AuthMiddleware)
    
    # Add test endpoints
    @test_app.get("/")
    async def root():
        return {"message": "public endpoint"}
    
    @test_app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    @test_app.get("/api/v1/protected")
    async def protected(request: Request):
        return {
            "message": "protected endpoint",
            "user_id": request.state.user_id,
            "user": request.state.user,
        }
    
    return test_app


@pytest.fixture
def client(app):
    """Create test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def valid_token():
    """Create a valid JWT token for testing."""
    return create_internal_jwt_token(
        user_id="test-user-id",
        email="test@example.com",
        role="authenticated"
    )


@pytest.fixture
def expired_token():
    """Create an expired JWT token for testing."""
    now = datetime.utcnow()
    issued_at = now - timedelta(days=2)
    expiration = now - timedelta(days=1)
    
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "role": "authenticated",
        "iat": int(issued_at.timestamp()),
        "exp": int(expiration.timestamp()),
    }
    
    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


@pytest.fixture
def mock_get_user_by_id():
    """Mock get_user_by_id function."""
    with patch("app.middleware.auth.get_user_by_id") as mock:
        mock.return_value = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "phone": "+8801712345678",
            "created_at": "2024-01-01T00:00:00Z",
            "user_metadata": {"name": "Test User"},
        }
        yield mock


class TestPublicEndpoints:
    """Test suite for public endpoint access without authentication."""
    
    def test_root_endpoint_no_auth(self, client):
        """Test that root endpoint is accessible without authentication."""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"message": "public endpoint"}
    
    def test_health_endpoint_no_auth(self, client):
        """Test that health endpoint is accessible without authentication."""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"status": "healthy"}
    
    def test_docs_endpoint_no_auth(self, client):
        """Test that docs endpoint is accessible without authentication."""
        # Note: This will return 404 since we don't have actual docs configured,
        # but it should not return 401 (authentication error)
        response = client.get("/docs")
        assert response.status_code != status.HTTP_401_UNAUTHORIZED
    
    def test_openapi_endpoint_no_auth(self, client):
        """Test that OpenAPI endpoint is accessible without authentication."""
        response = client.get("/openapi.json")
        assert response.status_code != status.HTTP_401_UNAUTHORIZED


class TestProtectedEndpoints:
    """Test suite for protected endpoint authentication."""
    
    def test_protected_endpoint_no_token(self, client):
        """Test that protected endpoint returns 401 without token."""
        response = client.get("/api/v1/protected")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "UNAUTHORIZED"
        assert "Missing authentication token" in data["error"]["message"]
    
    def test_protected_endpoint_with_valid_token(self, client, valid_token, mock_get_user_by_id):
        """Test that protected endpoint accepts valid token."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["message"] == "protected endpoint"
        assert data["user_id"] == "test-user-id"
        assert data["user"]["email"] == "test@example.com"
        
        # Verify get_user_by_id was called
        mock_get_user_by_id.assert_called_once_with("test-user-id")
    
    def test_protected_endpoint_with_expired_token(self, client, expired_token):
        """Test that protected endpoint rejects expired token."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "TOKEN_EXPIRED"
        assert "expired" in data["error"]["message"].lower()
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test that protected endpoint rejects invalid token."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": "Bearer invalid-token-string"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_TOKEN"
        assert "Invalid authentication token" in data["error"]["message"]
    
    def test_protected_endpoint_with_malformed_token(self, client):
        """Test that protected endpoint rejects malformed token."""
        # Create a token with wrong signature
        payload = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        
        malformed_token = jwt.encode(
            payload,
            "wrong-secret-key",
            algorithm=settings.JWT_ALGORITHM,
        )
        
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {malformed_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_TOKEN"


class TestTokenExtraction:
    """Test suite for token extraction from Authorization header."""
    
    def test_token_extraction_bearer_format(self, client, valid_token, mock_get_user_by_id):
        """Test token extraction with 'Bearer <token>' format."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_token_extraction_plain_format(self, client, valid_token, mock_get_user_by_id):
        """Test token extraction with plain token format."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": valid_token}
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_token_extraction_case_sensitive(self, client, valid_token):
        """Test that Authorization header is case-sensitive."""
        # FastAPI/Starlette normalizes headers to lowercase internally,
        # but we should test the expected behavior
        response = client.get(
            "/api/v1/protected",
            headers={"authorization": f"Bearer {valid_token}"}
        )
        
        # Should still work due to header normalization
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_missing_authorization_header(self, client):
        """Test request without Authorization header."""
        response = client.get("/api/v1/protected")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["error"]["code"] == "UNAUTHORIZED"


class TestUserAttachment:
    """Test suite for user object attachment to request state."""
    
    def test_user_attached_to_request_state(self, client, valid_token, mock_get_user_by_id):
        """Test that user object is attached to request.state."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "user" in data
        assert data["user"]["user_id"] == "test-user-id"
        assert data["user"]["email"] == "test@example.com"
    
    def test_user_id_attached_to_request_state(self, client, valid_token, mock_get_user_by_id):
        """Test that user_id is attached to request.state."""
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "user_id" in data
        assert data["user_id"] == "test-user-id"
    
    def test_user_not_found_in_database(self, client, valid_token):
        """Test handling when user is not found in database."""
        with patch("app.middleware.auth.get_user_by_id") as mock_get_user:
            mock_get_user.return_value = None
            
            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            
            data = response.json()
            assert data["error"]["code"] == "USER_NOT_FOUND"
            assert "User not found" in data["error"]["message"]


class TestErrorHandling:
    """Test suite for error handling in authentication middleware."""
    
    def test_database_error_during_user_lookup(self, client, valid_token):
        """Test handling of database errors during user lookup."""
        with patch("app.middleware.auth.get_user_by_id") as mock_get_user:
            mock_get_user.side_effect = Exception("Database connection error")
            
            response = client.get(
                "/api/v1/protected",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            
            data = response.json()
            assert data["error"]["code"] == "AUTHENTICATION_ERROR"
            assert "Authentication failed" in data["error"]["message"]
    
    def test_token_validation_error(self, client):
        """Test handling of token validation errors."""
        # Create a token with missing required fields
        payload = {
            "email": "test@example.com",
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        
        invalid_token = jwt.encode(
            payload,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        response = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {invalid_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMiddlewareIntegration:
    """Test suite for middleware integration scenarios."""
    
    def test_multiple_requests_with_same_token(self, client, valid_token, mock_get_user_by_id):
        """Test that same token can be used for multiple requests."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        
        # First request
        response1 = client.get("/api/v1/protected", headers=headers)
        assert response1.status_code == status.HTTP_200_OK
        
        # Second request with same token
        response2 = client.get("/api/v1/protected", headers=headers)
        assert response2.status_code == status.HTTP_200_OK
        
        # Verify get_user_by_id was called for both requests
        assert mock_get_user_by_id.call_count == 2
    
    def test_mixed_public_and_protected_requests(self, client, valid_token, mock_get_user_by_id):
        """Test that public and protected endpoints work correctly together."""
        # Public endpoint without token
        response1 = client.get("/health")
        assert response1.status_code == status.HTTP_200_OK
        
        # Protected endpoint with token
        response2 = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response2.status_code == status.HTTP_200_OK
        
        # Public endpoint again
        response3 = client.get("/")
        assert response3.status_code == status.HTTP_200_OK
    
    def test_different_http_methods(self, client, valid_token, mock_get_user_by_id):
        """Test that middleware works with different HTTP methods."""
        headers = {"Authorization": f"Bearer {valid_token}"}
        
        # GET request
        response_get = client.get("/api/v1/protected", headers=headers)
        assert response_get.status_code == status.HTTP_200_OK
        
        # POST request (will return 405 Method Not Allowed, but not 401)
        response_post = client.post("/api/v1/protected", headers=headers)
        assert response_post.status_code != status.HTTP_401_UNAUTHORIZED


class TestResponseFormat:
    """Test suite for authentication error response format."""
    
    def test_error_response_structure(self, client):
        """Test that error responses follow the expected structure."""
        response = client.get("/api/v1/protected")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert "success" in data
        assert data["success"] is False
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
    
    def test_error_codes_are_consistent(self, client, expired_token):
        """Test that error codes are consistent and meaningful."""
        # Missing token
        response1 = client.get("/api/v1/protected")
        assert response1.json()["error"]["code"] == "UNAUTHORIZED"
        
        # Expired token
        response2 = client.get(
            "/api/v1/protected",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response2.json()["error"]["code"] == "TOKEN_EXPIRED"
        
        # Invalid token
        response3 = client.get(
            "/api/v1/protected",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response3.json()["error"]["code"] == "INVALID_TOKEN"
    
    def test_error_messages_are_user_friendly(self, client):
        """Test that error messages are clear and user-friendly."""
        response = client.get("/api/v1/protected")
        
        data = response.json()
        message = data["error"]["message"]
        
        # Message should be clear and not expose internal details
        assert len(message) > 0
        assert "Missing authentication token" in message
        assert "stack trace" not in message.lower()
        assert "exception" not in message.lower()
