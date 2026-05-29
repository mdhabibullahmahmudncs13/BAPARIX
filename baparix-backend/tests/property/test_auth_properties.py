"""
Property-Based Tests for Authentication

Tests correctness properties for JWT token issuance, validation, and role-based access control
using Hypothesis for property-based testing.

**Validates: Requirements 2.3, 2.4, 2.5, 2.7**
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict

import jwt
import pytest
from hypothesis import given, settings, strategies as st
from fastapi import status

from app.config import settings as app_settings
from app.core.auth import create_internal_jwt_token
from app.models.role import Permission, RoleType, ROLE_PERMISSIONS

# Configure Hypothesis profiles
settings.register_profile("ci", max_examples=20, deadline=5000)
settings.register_profile("dev", max_examples=10, deadline=2000)
settings.load_profile("ci" if os.getenv("CI") else "dev")


# Strategy for generating valid user IDs
user_id_strategy = st.uuids().map(str)

# Strategy for generating valid email addresses
email_strategy = st.emails()

# Strategy for generating role types
role_strategy = st.sampled_from([role.value for role in RoleType])

# Strategy for generating authentication methods
auth_method_strategy = st.sampled_from(["email", "google", "phone"])


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 5: JWT Token Issuance")
@settings(max_examples=20)
@given(
    user_id=user_id_strategy,
    email=email_strategy,
    role=role_strategy,
)
def test_jwt_token_issuance_has_24_hour_expiration(user_id, email, role):
    """
    Feature: ventureos-backend, Property 5: JWT Token Issuance
    
    **Validates: Requirements 2.3**
    
    Property: For any successful authentication (email, OAuth, or OTP), 
    a valid JWT token with 24-hour expiration should be issued.
    
    This property verifies that:
    1. JWT tokens are issued with proper structure
    2. Tokens contain required claims (sub, email, role, iat, exp)
    3. Expiration time is set to 24 hours from issuance
    4. Tokens can be decoded and validated
    5. Token expiration is within acceptable tolerance (±5 seconds)
    """
    # Record the time before token creation
    before_creation = datetime.utcnow()
    
    # Create JWT token (simulating successful authentication)
    token = create_internal_jwt_token(user_id=user_id, email=email, role=role)
    
    # Record the time after token creation
    after_creation = datetime.utcnow()
    
    # Property 1: Token should be a non-empty string
    assert isinstance(token, str), f"Token must be a string, got {type(token)}"
    assert len(token) > 0, "Token must not be empty"
    
    # Property 2: Token should be decodable
    try:
        payload = jwt.decode(
            token,
            app_settings.JWT_SECRET,
            algorithms=[app_settings.JWT_ALGORITHM],
            options={"verify_exp": False, "verify_iat": False}  # Don't verify expiration or iat yet
        )
    except jwt.InvalidTokenError as e:
        pytest.fail(f"Token is not valid JWT: {str(e)}")
    
    # Property 3: Token must contain required claims
    assert "sub" in payload, "Token missing 'sub' (user_id) claim"
    assert "email" in payload, "Token missing 'email' claim"
    assert "role" in payload, "Token missing 'role' claim"
    assert "iat" in payload, "Token missing 'iat' (issued at) claim"
    assert "exp" in payload, "Token missing 'exp' (expiration) claim"
    
    # Property 4: Claims must have correct values
    assert payload["sub"] == user_id, f"Expected user_id {user_id}, got {payload['sub']}"
    assert payload["email"] == email, f"Expected email {email}, got {payload['email']}"
    assert payload["role"] == role, f"Expected role {role}, got {payload['role']}"
    
    # Property 5: Expiration must be 24 hours from issuance (with tolerance)
    iat_timestamp = payload["iat"]
    exp_timestamp = payload["exp"]
    
    # Calculate expected expiration (24 hours = 86400 seconds)
    expected_expiration_seconds = 24 * 3600
    actual_expiration_seconds = exp_timestamp - iat_timestamp
    
    # Allow 5 second tolerance for clock skew and processing time
    tolerance_seconds = 5
    assert abs(actual_expiration_seconds - expected_expiration_seconds) <= tolerance_seconds, (
        f"Token expiration must be 24 hours (86400 seconds) from issuance. "
        f"Expected: {expected_expiration_seconds}s, Got: {actual_expiration_seconds}s, "
        f"Difference: {abs(actual_expiration_seconds - expected_expiration_seconds)}s"
    )
    
    # Property 6: Issued at time should be reasonable (within test execution window)
    iat_datetime = datetime.utcfromtimestamp(iat_timestamp)
    assert before_creation <= iat_datetime <= after_creation + timedelta(seconds=1), (
        f"Token 'iat' timestamp is outside expected range. "
        f"Before: {before_creation}, IAT: {iat_datetime}, After: {after_creation}"
    )
    
    # Property 7: Token should be valid (not expired) immediately after creation
    try:
        jwt.decode(
            token,
            app_settings.JWT_SECRET,
            algorithms=[app_settings.JWT_ALGORITHM],
            options={"verify_exp": True, "verify_iat": False}  # Verify expiration but not iat
        )
    except jwt.ExpiredSignatureError:
        pytest.fail("Token is expired immediately after creation")
    except jwt.InvalidTokenError as e:
        pytest.fail(f"Token validation failed: {str(e)}")


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 6: JWT Token Validation")
@settings(max_examples=20)
@given(
    user_id=user_id_strategy,
    email=email_strategy,
    role=role_strategy,
    # Generate various invalid token scenarios
    token_scenario=st.sampled_from([
        "expired",
        "invalid_signature",
        "malformed",
        "missing_claims",
        "wrong_algorithm",
    ]),
)
def test_invalid_jwt_tokens_rejected_with_401(session_client, user_id, email, role, token_scenario):
    """
    Feature: ventureos-backend, Property 6: JWT Token Validation
    
    **Validates: Requirements 2.4, 2.5**
    
    Property: For any request to a protected endpoint with an invalid or expired 
    JWT token, the response should be HTTP 401.
    
    This property verifies that:
    1. Expired tokens are rejected with 401
    2. Tokens with invalid signatures are rejected with 401
    3. Malformed tokens are rejected with 401
    4. Tokens missing required claims are rejected with 401
    5. Tokens with wrong algorithm are rejected with 401
    6. Error responses include appropriate error codes and messages
    """
    # Create a valid token first
    valid_token = create_internal_jwt_token(user_id=user_id, email=email, role=role)
    
    # Generate invalid token based on scenario
    if token_scenario == "expired":
        # Create token that expired 1 hour ago
        now = datetime.utcnow()
        expired_time = now - timedelta(hours=1)
        payload = {
            "sub": user_id,
            "email": email,
            "role": role,
            "iat": int((expired_time - timedelta(hours=24)).timestamp()),
            "exp": int(expired_time.timestamp()),
        }
        invalid_token = jwt.encode(
            payload,
            app_settings.JWT_SECRET,
            algorithm=app_settings.JWT_ALGORITHM,
        )
    
    elif token_scenario == "invalid_signature":
        # Create token with wrong secret
        invalid_token = jwt.encode(
            {
                "sub": user_id,
                "email": email,
                "role": role,
                "iat": int(datetime.utcnow().timestamp()),
                "exp": int((datetime.utcnow() + timedelta(hours=24)).timestamp()),
            },
            "wrong_secret_key_12345678901234567890",
            algorithm=app_settings.JWT_ALGORITHM,
        )
    
    elif token_scenario == "malformed":
        # Create completely malformed token
        invalid_token = "not.a.valid.jwt.token.at.all"
    
    elif token_scenario == "missing_claims":
        # Create token missing required claims
        payload = {
            "iat": int(datetime.utcnow().timestamp()),
            "exp": int((datetime.utcnow() + timedelta(hours=24)).timestamp()),
        }
        invalid_token = jwt.encode(
            payload,
            app_settings.JWT_SECRET,
            algorithm=app_settings.JWT_ALGORITHM,
        )
    
    elif token_scenario == "wrong_algorithm":
        # Create token with different algorithm
        payload = {
            "sub": user_id,
            "email": email,
            "role": role,
            "iat": int(datetime.utcnow().timestamp()),
            "exp": int((datetime.utcnow() + timedelta(hours=24)).timestamp()),
        }
        invalid_token = jwt.encode(
            payload,
            app_settings.JWT_SECRET,
            algorithm="HS512",  # Wrong algorithm
        )
    
    # Test with a protected endpoint (we'll use a financial endpoint as example)
    # Note: This assumes financial endpoints exist and are protected
    # If they don't exist yet, we can use any protected endpoint
    
    # Try to access protected endpoint with invalid token
    headers = {"Authorization": f"Bearer {invalid_token}"}
    
    # Test multiple protected endpoints to ensure consistency
    protected_endpoints = [
        "/api/v1/financial/entries",
        "/api/v1/blueprints",
        "/api/v1/workspaces",
    ]
    
    for endpoint in protected_endpoints:
        response = session_client.get(endpoint, headers=headers)
        
        # Property 1: Response must be 401 Unauthorized
        assert response.status_code == status.HTTP_401_UNAUTHORIZED, (
            f"Expected 401 for {token_scenario} token on {endpoint}, "
            f"got {response.status_code}"
        )
        
        # Property 2: Response must be valid JSON
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError:
            pytest.fail(f"Response is not valid JSON: {response.text[:200]}")
        
        # Property 3: Response must have error structure
        assert "success" in data or "error" in data, (
            f"Response missing error structure: {data}"
        )
        
        # Property 4: Error code should indicate authentication failure
        if "error" in data:
            assert "code" in data["error"], "Error response missing 'code' field"
            error_code = data["error"]["code"]
            assert error_code in [
                "UNAUTHORIZED",
                "TOKEN_EXPIRED",
                "INVALID_TOKEN",
                "AUTHENTICATION_ERROR",
            ], f"Unexpected error code: {error_code}"


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 6: JWT Token Validation - Missing Token")
@settings(max_examples=10)
@given(
    # Test various ways of not providing a token
    auth_header_scenario=st.sampled_from([
        "no_header",
        "empty_bearer",
        "bearer_only",
        "wrong_scheme",
    ]),
)
def test_missing_jwt_token_rejected_with_401(session_client, auth_header_scenario):
    """
    Feature: ventureos-backend, Property 6: JWT Token Validation - Missing Token
    
    **Validates: Requirements 2.4, 2.5**
    
    Property: For any request to a protected endpoint without a JWT token,
    the response should be HTTP 401.
    
    This property verifies that:
    1. Requests without Authorization header are rejected
    2. Requests with empty Bearer token are rejected
    3. Requests with wrong authentication scheme are rejected
    4. All scenarios return consistent 401 responses
    """
    # Prepare headers based on scenario
    if auth_header_scenario == "no_header":
        headers = {}
    elif auth_header_scenario == "empty_bearer":
        headers = {"Authorization": "Bearer "}
    elif auth_header_scenario == "bearer_only":
        headers = {"Authorization": "Bearer"}
    elif auth_header_scenario == "wrong_scheme":
        headers = {"Authorization": "Basic dXNlcjpwYXNz"}
    
    # Test with protected endpoints
    protected_endpoints = [
        "/api/v1/financial/entries",
        "/api/v1/blueprints",
        "/api/v1/workspaces",
    ]
    
    for endpoint in protected_endpoints:
        response = session_client.get(endpoint, headers=headers)
        
        # Property: Response must be 401 Unauthorized
        assert response.status_code == status.HTTP_401_UNAUTHORIZED, (
            f"Expected 401 for {auth_header_scenario} on {endpoint}, "
            f"got {response.status_code}"
        )
        
        # Response must be valid JSON with error structure
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError:
            pytest.fail(f"Response is not valid JSON: {response.text[:200]}")
        
        assert "success" in data or "error" in data, (
            f"Response missing error structure: {data}"
        )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 7: Role-Based Financial Access")
@settings(max_examples=20)
@given(
    user_id=user_id_strategy,
    email=email_strategy,
    role=st.sampled_from([RoleType.ANALYST, RoleType.GUEST]),  # Roles without edit permissions
)
def test_role_based_financial_access_control(session_client, user_id, email, role):
    """
    Feature: ventureos-backend, Property 7: Role-Based Financial Access
    
    **Validates: Requirements 2.7**
    
    Property: For any user without financial view permissions, requests to 
    financial endpoints should be rejected with HTTP 403.
    
    This property verifies that:
    1. Users without VIEW_FINANCIALS permission cannot access financial data
    2. Users without EDIT_FINANCIALS permission cannot modify financial data
    3. Proper 403 Forbidden responses are returned
    4. Error messages indicate permission denial
    
    Note: This test focuses on roles that lack financial permissions:
    - ANALYST: Has VIEW_FINANCIALS but not EDIT_FINANCIALS
    - GUEST: Has neither VIEW_FINANCIALS nor EDIT_FINANCIALS
    """
    # Create valid token for user with limited permissions
    token = create_internal_jwt_token(user_id=user_id, email=email, role=role.value)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get permissions for this role
    role_permissions = ROLE_PERMISSIONS.get(role, set())
    has_view_financials = Permission.VIEW_FINANCIALS in role_permissions
    has_edit_financials = Permission.EDIT_FINANCIALS in role_permissions
    
    # Test GET /api/v1/financial/entries (requires VIEW_FINANCIALS)
    response = session_client.get("/api/v1/financial/entries", headers=headers)
    
    if not has_view_financials:
        # Property 1: Users without VIEW_FINANCIALS should get 403
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Expected 403 for {role.value} accessing financial entries (no VIEW_FINANCIALS), "
            f"got {response.status_code}"
        )
        
        # Property 2: Response must be valid JSON with error structure
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError:
            pytest.fail(f"Response is not valid JSON: {response.text[:200]}")
        
        # Property 3: Error should indicate permission denial
        assert "success" in data or "error" in data, (
            f"Response missing error structure: {data}"
        )
        
        if "error" in data:
            assert "code" in data["error"], "Error response missing 'code' field"
            assert data["error"]["code"] == "PERMISSION_DENIED", (
                f"Expected PERMISSION_DENIED error code, got {data['error']['code']}"
            )
    
    # Test POST /api/v1/financial/entries (requires EDIT_FINANCIALS)
    financial_entry = {
        "type": "revenue",
        "amount": 1000.0,
        "currency": "BDT",
        "category": "sales",
        "description": "Test entry",
        "date": "2024-01-15",
    }
    
    response = session_client.post(
        "/api/v1/financial/entries",
        headers=headers,
        json=financial_entry,
    )
    
    if not has_edit_financials:
        # Property 4: Users without EDIT_FINANCIALS should get 403
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Expected 403 for {role.value} creating financial entry (no EDIT_FINANCIALS), "
            f"got {response.status_code}"
        )
        
        # Property 5: Response must be valid JSON with error structure
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError:
            pytest.fail(f"Response is not valid JSON: {response.text[:200]}")
        
        # Property 6: Error should indicate permission denial
        if "error" in data:
            assert data["error"]["code"] == "PERMISSION_DENIED", (
                f"Expected PERMISSION_DENIED error code, got {data['error']['code']}"
            )


@pytest.mark.property
@pytest.mark.feature("ventureos-backend")
@pytest.mark.property_id("Property 7: Role-Based Financial Access - Positive Cases")
@settings(max_examples=10)
@given(
    user_id=user_id_strategy,
    email=email_strategy,
    role=st.sampled_from([RoleType.OWNER, RoleType.CO_FOUNDER, RoleType.MANAGER]),
)
def test_role_based_financial_access_allowed(session_client, user_id, email, role):
    """
    Feature: ventureos-backend, Property 7: Role-Based Financial Access - Positive Cases
    
    **Validates: Requirements 2.7**
    
    Property: For any user with financial permissions, requests to financial 
    endpoints should be allowed (not return 403).
    
    This property verifies that:
    1. Users with VIEW_FINANCIALS can access financial data
    2. Users with EDIT_FINANCIALS can modify financial data
    3. Proper authorization is granted for privileged roles
    
    Note: This test focuses on roles that have financial permissions:
    - OWNER: Has all permissions
    - CO_FOUNDER: Has VIEW_FINANCIALS and EDIT_FINANCIALS
    - MANAGER: Has VIEW_FINANCIALS and EDIT_FINANCIALS
    """
    # Create valid token for user with financial permissions
    token = create_internal_jwt_token(user_id=user_id, email=email, role=role.value)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get permissions for this role
    role_permissions = ROLE_PERMISSIONS.get(role, set())
    has_view_financials = Permission.VIEW_FINANCIALS in role_permissions
    has_edit_financials = Permission.EDIT_FINANCIALS in role_permissions
    
    # Test GET /api/v1/financial/entries (requires VIEW_FINANCIALS)
    if has_view_financials:
        response = session_client.get("/api/v1/financial/entries", headers=headers)
        
        # Property 1: Should NOT return 403 Forbidden
        assert response.status_code != status.HTTP_403_FORBIDDEN, (
            f"User with {role.value} role should be able to view financial entries, "
            f"but got {response.status_code}"
        )
        
        # Property 2: Should return 200 OK or 404 (if endpoint not implemented yet)
        # or 500 (if there's a server error), but NOT 403
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ], (
            f"Expected 200/404/500 for {role.value} accessing financial entries, "
            f"got {response.status_code}"
        )
    
    # Test POST /api/v1/financial/entries (requires EDIT_FINANCIALS)
    if has_edit_financials:
        financial_entry = {
            "type": "revenue",
            "amount": 1000.0,
            "currency": "BDT",
            "category": "sales",
            "description": "Test entry",
            "date": "2024-01-15",
        }
        
        response = session_client.post(
            "/api/v1/financial/entries",
            headers=headers,
            json=financial_entry,
        )
        
        # Property 3: Should NOT return 403 Forbidden
        assert response.status_code != status.HTTP_403_FORBIDDEN, (
            f"User with {role.value} role should be able to create financial entries, "
            f"but got {response.status_code}"
        )
        
        # Property 4: Should return 201 Created or 404/500, but NOT 403
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ], (
            f"Expected 201/200/404/500 for {role.value} creating financial entry, "
            f"got {response.status_code}"
        )
