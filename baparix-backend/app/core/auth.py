"""
Authentication Module

This module handles Supabase Auth integration, JWT token validation,
and user authentication for email, Google OAuth, and phone OTP methods.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional

import jwt
import structlog
from supabase import Client, create_client

from app.config import settings

logger = structlog.get_logger(__name__)


# Initialize Supabase client
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance.
    
    Returns:
        Client: Supabase client instance
    """
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY,
        )
        logger.info("supabase_client_initialized")
    
    return _supabase_client


def get_supabase_admin_client() -> Client:
    """
    Get Supabase admin client with service role key.
    
    This client has elevated permissions for admin operations.
    
    Returns:
        Client: Supabase admin client instance
    """
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY,
    )


async def create_user_with_email(
    email: str,
    password: str,
    name: str,
    phone: Optional[str] = None,
    locale: str = "en",
) -> Dict:
    """
    Create a new user with email and password.
    
    Args:
        email: User's email address
        password: User's password
        name: User's full name
        phone: User's phone number (optional)
        locale: User's preferred locale (default: "en")
    
    Returns:
        dict: User data with access_token, refresh_token, and user info
    
    Raises:
        Exception: If user creation fails
    """
    try:
        client = get_supabase_client()
        
        # Sign up user with Supabase Auth
        response = client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": name,
                    "phone": phone,
                    "locale": locale,
                }
            }
        })
        
        if not response.user:
            raise Exception("User creation failed")
        
        logger.info(
            "user_created",
            user_id=response.user.id,
            email=email,
            locale=locale,
        )
        
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "access_token": response.session.access_token if response.session else None,
            "refresh_token": response.session.refresh_token if response.session else None,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        }
    
    except Exception as e:
        logger.error(
            "user_creation_failed",
            email=email,
            error=str(e),
        )
        raise


async def authenticate_with_email(email: str, password: str) -> Dict:
    """
    Authenticate user with email and password.
    
    Args:
        email: User's email address
        password: User's password
    
    Returns:
        dict: User data with access_token, refresh_token, and user info
    
    Raises:
        Exception: If authentication fails
    """
    try:
        client = get_supabase_client()
        
        # Sign in user with Supabase Auth
        response = client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        
        if not response.user or not response.session:
            raise Exception("Authentication failed")
        
        logger.info(
            "user_authenticated",
            user_id=response.user.id,
            email=email,
        )
        
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        }
    
    except Exception as e:
        logger.error(
            "authentication_failed",
            email=email,
            error=str(e),
        )
        raise


async def authenticate_with_google(id_token: str) -> Dict:
    """
    Authenticate user with Google OAuth.
    
    Args:
        id_token: Google OAuth ID token
    
    Returns:
        dict: User data with access_token, refresh_token, and user info
    
    Raises:
        Exception: If authentication fails
    """
    try:
        client = get_supabase_client()
        
        # Sign in with Google OAuth
        response = client.auth.sign_in_with_id_token({
            "provider": "google",
            "token": id_token,
        })
        
        if not response.user or not response.session:
            raise Exception("Google authentication failed")
        
        logger.info(
            "user_authenticated_google",
            user_id=response.user.id,
            email=response.user.email,
        )
        
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        }
    
    except Exception as e:
        logger.error(
            "google_authentication_failed",
            error=str(e),
        )
        raise


async def send_phone_otp(phone: str) -> Dict:
    """
    Send OTP to user's phone number.
    
    Args:
        phone: User's phone number in E.164 format (e.g., +8801712345678)
    
    Returns:
        dict: Response with success status
    
    Raises:
        Exception: If OTP sending fails
    """
    try:
        client = get_supabase_client()
        
        # Send OTP via Supabase Auth
        response = client.auth.sign_in_with_otp({
            "phone": phone,
        })
        
        logger.info(
            "phone_otp_sent",
            phone=phone,
        )
        
        return {
            "success": True,
            "message": "OTP sent successfully",
        }
    
    except Exception as e:
        logger.error(
            "phone_otp_send_failed",
            phone=phone,
            error=str(e),
        )
        raise


async def verify_phone_otp(phone: str, otp: str) -> Dict:
    """
    Verify OTP for phone authentication.
    
    Args:
        phone: User's phone number in E.164 format
        otp: One-time password received via SMS
    
    Returns:
        dict: User data with access_token, refresh_token, and user info
    
    Raises:
        Exception: If OTP verification fails
    """
    try:
        client = get_supabase_client()
        
        # Verify OTP with Supabase Auth
        response = client.auth.verify_otp({
            "phone": phone,
            "token": otp,
            "type": "sms",
        })
        
        if not response.user or not response.session:
            raise Exception("OTP verification failed")
        
        logger.info(
            "phone_otp_verified",
            user_id=response.user.id,
            phone=phone,
        )
        
        return {
            "user_id": response.user.id,
            "phone": response.user.phone,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        }
    
    except Exception as e:
        logger.error(
            "phone_otp_verification_failed",
            phone=phone,
            error=str(e),
        )
        raise


async def refresh_access_token(refresh_token: str) -> Dict:
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_token: Valid refresh token
    
    Returns:
        dict: New access_token and expires_in
    
    Raises:
        Exception: If token refresh fails
    """
    try:
        client = get_supabase_client()
        
        # Refresh session with Supabase Auth
        response = client.auth.refresh_session(refresh_token)
        
        if not response.session:
            raise Exception("Token refresh failed")
        
        logger.info(
            "token_refreshed",
            user_id=response.user.id if response.user else None,
        )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
        }
    
    except Exception as e:
        logger.error(
            "token_refresh_failed",
            error=str(e),
        )
        raise


async def validate_jwt_token(token: str) -> Dict:
    """
    Validate JWT token and extract user information.
    
    This function validates the token signature, expiration, and format.
    
    Args:
        token: JWT access token
    
    Returns:
        dict: Decoded token payload with user information
    
    Raises:
        jwt.ExpiredSignatureError: If token has expired
        jwt.InvalidTokenError: If token is invalid
    """
    try:
        # Decode and validate JWT token
        # Note: verify_iat is disabled to avoid clock skew issues in testing
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": False,  # Disable iat verification to avoid clock skew issues
            }
        )
        
        # Extract user information from payload
        user_id = payload.get("sub")
        email = payload.get("email")
        phone = payload.get("phone")
        role = payload.get("role", "authenticated")
        
        if not user_id:
            raise jwt.InvalidTokenError("Token missing user ID")
        
        logger.debug(
            "token_validated",
            user_id=user_id,
            email=email,
        )
        
        return {
            "user_id": user_id,
            "email": email,
            "phone": phone,
            "role": role,
            "exp": payload.get("exp"),
            "iat": payload.get("iat"),
        }
    
    except jwt.ExpiredSignatureError:
        logger.warning("token_expired")
        raise
    
    except jwt.InvalidTokenError as e:
        logger.warning(
            "token_invalid",
            error=str(e),
        )
        raise


async def get_user_by_id(user_id: str) -> Optional[Dict]:
    """
    Get user information by user ID.
    
    Args:
        user_id: User's unique identifier
    
    Returns:
        dict: User information or None if not found
    """
    try:
        admin_client = get_supabase_admin_client()
        
        # Get user with admin client
        response = admin_client.auth.admin.get_user_by_id(user_id)
        
        if not response.user:
            return None
        
        user = response.user
        
        return {
            "user_id": user.id,
            "email": user.email,
            "phone": user.phone,
            "created_at": user.created_at,
            "last_sign_in_at": user.last_sign_in_at,
            "user_metadata": user.user_metadata,
        }
    
    except Exception as e:
        logger.error(
            "get_user_failed",
            user_id=user_id,
            error=str(e),
        )
        return None


async def sign_out(access_token: str) -> Dict:
    """
    Sign out user and invalidate session.
    
    Args:
        access_token: User's access token
    
    Returns:
        dict: Success status
    """
    try:
        client = get_supabase_client()
        
        # Sign out user
        client.auth.sign_out()
        
        logger.info("user_signed_out")
        
        return {
            "success": True,
            "message": "User signed out successfully",
        }
    
    except Exception as e:
        logger.error(
            "sign_out_failed",
            error=str(e),
        )
        raise


def create_internal_jwt_token(user_id: str, email: str, role: str = "authenticated") -> str:
    """
    Create internal JWT token for testing or internal use.
    
    This function is useful for testing and should not be used in production
    for user-facing authentication (use Supabase Auth instead).
    
    Args:
        user_id: User's unique identifier
        email: User's email address
        role: User's role (default: "authenticated")
    
    Returns:
        str: JWT token
    """
    now = datetime.utcnow()
    expiration = now + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expiration.timestamp()),
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token
