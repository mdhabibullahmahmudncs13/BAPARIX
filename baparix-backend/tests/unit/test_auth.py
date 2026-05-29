"""
Unit Tests for Authentication Module

Tests Supabase Auth integration, JWT token validation,
and user authentication functions.
"""

import jwt
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.config import settings
from app.core.auth import (
    authenticate_with_email,
    authenticate_with_google,
    create_internal_jwt_token,
    create_user_with_email,
    get_supabase_client,
    get_user_by_id,
    refresh_access_token,
    send_phone_otp,
    sign_out,
    validate_jwt_token,
    verify_phone_otp,
)


@pytest.fixture
def mock_supabase_client(monkeypatch):
    """Mock Supabase client for testing."""
    mock_client = MagicMock()
    
    def mock_create_client(*args, **kwargs):
        return mock_client
    
    monkeypatch.setattr("app.core.auth.create_client", mock_create_client)
    # Reset the global client to ensure fresh mock
    monkeypatch.setattr("app.core.auth._supabase_client", None)
    
    yield mock_client


class TestSupabaseClientInitialization:
    """Test suite for Supabase client initialization."""
    
    def test_get_supabase_client(self, mock_supabase_client):
        """Test that Supabase client is initialized correctly."""
        client = get_supabase_client()
        assert client is not None
    
    def test_get_supabase_client_singleton(self, mock_supabase_client):
        """Test that Supabase client is a singleton."""
        client1 = get_supabase_client()
        client2 = get_supabase_client()
        assert client1 is client2


class TestUserCreation:
    """Test suite for user creation with email."""
    
    @pytest.mark.asyncio
    async def test_create_user_with_email_success(self, mock_supabase_client):
        """Test successful user creation with email and password."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        
        mock_session = MagicMock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.sign_up.return_value = mock_response
        
        # Create user
        result = await create_user_with_email(
            email="test@example.com",
            password="SecurePass123!",
            name="Test User",
            phone="+8801712345678",
            locale="bn"
        )
        
        # Verify result
        assert result["user_id"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["access_token"] == "test-access-token"
        assert result["refresh_token"] == "test-refresh-token"
        assert result["expires_in"] == settings.JWT_EXPIRATION_HOURS * 3600
        
        # Verify Supabase was called correctly
        mock_supabase_client.auth.sign_up.assert_called_once()
        call_args = mock_supabase_client.auth.sign_up.call_args[0][0]
        assert call_args["email"] == "test@example.com"
        assert call_args["password"] == "SecurePass123!"
        assert call_args["options"]["data"]["name"] == "Test User"
        assert call_args["options"]["data"]["phone"] == "+8801712345678"
        assert call_args["options"]["data"]["locale"] == "bn"
    
    @pytest.mark.asyncio
    async def test_create_user_with_email_failure(self, mock_supabase_client):
        """Test user creation failure handling."""
        # Mock Supabase response with no user
        mock_response = MagicMock()
        mock_response.user = None
        
        mock_supabase_client.auth.sign_up.return_value = mock_response
        
        # Attempt to create user
        with pytest.raises(Exception, match="User creation failed"):
            await create_user_with_email(
                email="test@example.com",
                password="SecurePass123!",
                name="Test User"
            )


class TestEmailAuthentication:
    """Test suite for email authentication."""
    
    @pytest.mark.asyncio
    async def test_authenticate_with_email_success(self, mock_supabase_client):
        """Test successful authentication with email and password."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        
        mock_session = MagicMock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_response
        
        # Authenticate user
        result = await authenticate_with_email(
            email="test@example.com",
            password="SecurePass123!"
        )
        
        # Verify result
        assert result["user_id"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["access_token"] == "test-access-token"
        assert result["refresh_token"] == "test-refresh-token"
        
        # Verify Supabase was called correctly
        mock_supabase_client.auth.sign_in_with_password.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_authenticate_with_email_failure(self, mock_supabase_client):
        """Test authentication failure handling."""
        # Mock Supabase response with no user
        mock_response = MagicMock()
        mock_response.user = None
        mock_response.session = None
        
        mock_supabase_client.auth.sign_in_with_password.return_value = mock_response
        
        # Attempt to authenticate
        with pytest.raises(Exception, match="Authentication failed"):
            await authenticate_with_email(
                email="test@example.com",
                password="WrongPassword"
            )


class TestGoogleAuthentication:
    """Test suite for Google OAuth authentication."""
    
    @pytest.mark.asyncio
    async def test_authenticate_with_google_success(self, mock_supabase_client):
        """Test successful Google OAuth authentication."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        
        mock_session = MagicMock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.sign_in_with_id_token.return_value = mock_response
        
        # Authenticate with Google
        result = await authenticate_with_google(id_token="google-id-token")
        
        # Verify result
        assert result["user_id"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["access_token"] == "test-access-token"
        
        # Verify Supabase was called correctly
        mock_supabase_client.auth.sign_in_with_id_token.assert_called_once()


class TestPhoneOTPAuthentication:
    """Test suite for phone OTP authentication."""
    
    @pytest.mark.asyncio
    async def test_send_phone_otp_success(self, mock_supabase_client):
        """Test successful OTP sending."""
        # Mock Supabase response
        mock_supabase_client.auth.sign_in_with_otp.return_value = MagicMock()
        
        # Send OTP
        result = await send_phone_otp(phone="+8801712345678")
        
        # Verify result
        assert result["success"] is True
        assert "OTP sent successfully" in result["message"]
        
        # Verify Supabase was called correctly
        mock_supabase_client.auth.sign_in_with_otp.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_verify_phone_otp_success(self, mock_supabase_client):
        """Test successful OTP verification."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.phone = "+8801712345678"
        
        mock_session = MagicMock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.verify_otp.return_value = mock_response
        
        # Verify OTP
        result = await verify_phone_otp(
            phone="+8801712345678",
            otp="123456"
        )
        
        # Verify result
        assert result["user_id"] == "test-user-id"
        assert result["phone"] == "+8801712345678"
        assert result["access_token"] == "test-access-token"


class TestTokenOperations:
    """Test suite for JWT token operations."""
    
    @pytest.mark.asyncio
    async def test_validate_jwt_token_success(self):
        """Test successful JWT token validation."""
        # Create token at test time to avoid timing issues
        now = datetime.utcnow()
        expiration = now + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        payload = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "role": "authenticated",
            "iat": int(now.timestamp()),
            "exp": int(expiration.timestamp()),
        }
        
        token = jwt.encode(
            payload,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        result = await validate_jwt_token(token)
        
        assert result["user_id"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["role"] == "authenticated"
        assert "exp" in result
        assert "iat" in result
    
    @pytest.mark.asyncio
    async def test_validate_jwt_token_expired(self):
        """Test that expired JWT tokens are rejected."""
        # Create expired token - make it very clearly expired
        now = datetime.utcnow()
        issued_at = now - timedelta(days=2)  # Issued 2 days ago
        expiration = now - timedelta(days=1)  # Expired 1 day ago
        
        payload = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "role": "authenticated",
            "iat": int(issued_at.timestamp()),
            "exp": int(expiration.timestamp()),
        }
        
        token = jwt.encode(
            payload,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        with pytest.raises(jwt.ExpiredSignatureError):
            await validate_jwt_token(token)
    
    @pytest.mark.asyncio
    async def test_validate_jwt_token_invalid(self):
        """Test that invalid JWT tokens are rejected."""
        with pytest.raises(jwt.InvalidTokenError):
            await validate_jwt_token("invalid-token")
    
    @pytest.mark.asyncio
    async def test_validate_jwt_token_missing_user_id(self):
        """Test that tokens without user ID are rejected."""
        # Create token without user ID
        payload = {
            "email": "test@example.com",
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        
        with pytest.raises(jwt.InvalidTokenError, match="Token missing user ID"):
            await validate_jwt_token(token)
    
    @pytest.mark.asyncio
    async def test_refresh_access_token_success(self, mock_supabase_client):
        """Test successful token refresh."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        
        mock_session = MagicMock()
        mock_session.access_token = "new-access-token"
        mock_session.refresh_token = "new-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.refresh_session.return_value = mock_response
        
        # Refresh token
        result = await refresh_access_token(refresh_token="old-refresh-token")
        
        # Verify result
        assert result["access_token"] == "new-access-token"
        assert result["refresh_token"] == "new-refresh-token"
        assert result["expires_in"] == settings.JWT_EXPIRATION_HOURS * 3600
    
    def test_create_internal_jwt_token(self):
        """Test internal JWT token creation."""
        token = create_internal_jwt_token(
            user_id="test-user-id",
            email="test@example.com",
            role="admin"
        )
        
        # Decode and verify token (disable iat verification for this test)
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_iat": False}
        )
        
        assert payload["sub"] == "test-user-id"
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "admin"
        assert "iat" in payload
        assert "exp" in payload


class TestUserOperations:
    """Test suite for user operations."""
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self):
        """Test successful user retrieval by ID."""
        with patch("app.core.auth.get_supabase_admin_client") as mock_admin:
            # Mock admin client response
            mock_user = MagicMock()
            mock_user.id = "test-user-id"
            mock_user.email = "test@example.com"
            mock_user.phone = "+8801712345678"
            mock_user.created_at = "2024-01-01T00:00:00Z"
            mock_user.last_sign_in_at = "2024-01-15T10:30:00Z"
            mock_user.user_metadata = {"name": "Test User"}
            
            mock_response = MagicMock()
            mock_response.user = mock_user
            
            mock_client = MagicMock()
            mock_client.auth.admin.get_user_by_id.return_value = mock_response
            mock_admin.return_value = mock_client
            
            # Get user
            result = await get_user_by_id("test-user-id")
            
            # Verify result
            assert result["user_id"] == "test-user-id"
            assert result["email"] == "test@example.com"
            assert result["phone"] == "+8801712345678"
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self):
        """Test user retrieval when user not found."""
        with patch("app.core.auth.get_supabase_admin_client") as mock_admin:
            # Mock admin client response with no user
            mock_response = MagicMock()
            mock_response.user = None
            
            mock_client = MagicMock()
            mock_client.auth.admin.get_user_by_id.return_value = mock_response
            mock_admin.return_value = mock_client
            
            # Get user
            result = await get_user_by_id("nonexistent-user-id")
            
            # Verify result is None
            assert result is None
    
    @pytest.mark.asyncio
    async def test_sign_out_success(self, mock_supabase_client):
        """Test successful user sign out."""
        # Mock Supabase sign out
        mock_supabase_client.auth.sign_out.return_value = None
        
        # Sign out
        result = await sign_out(access_token="test-access-token")
        
        # Verify result
        assert result["success"] is True
        assert "signed out successfully" in result["message"]
        
        # Verify Supabase was called
        mock_supabase_client.auth.sign_out.assert_called_once()


class TestAuthenticationEdgeCases:
    """Test suite for authentication edge cases."""
    
    @pytest.mark.asyncio
    async def test_create_user_with_minimal_data(self, mock_supabase_client):
        """Test user creation with minimal required data."""
        # Mock Supabase response
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        
        mock_session = MagicMock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase_client.auth.sign_up.return_value = mock_response
        
        # Create user with minimal data
        result = await create_user_with_email(
            email="test@example.com",
            password="SecurePass123!",
            name="Test User"
        )
        
        # Verify result
        assert result["user_id"] == "test-user-id"
        assert result["email"] == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_token_validation_with_different_roles(self):
        """Test token validation with different user roles."""
        roles = ["authenticated", "admin", "service_role"]
        
        for role in roles:
            now = datetime.utcnow()
            expiration = now + timedelta(hours=1)
            
            payload = {
                "sub": "test-user-id",
                "email": "test@example.com",
                "role": role,
                "iat": int(now.timestamp()),
                "exp": int(expiration.timestamp()),
            }
            
            token = jwt.encode(
                payload,
                settings.JWT_SECRET,
                algorithm=settings.JWT_ALGORITHM,
            )
            
            result = await validate_jwt_token(token)
            assert result["role"] == role
