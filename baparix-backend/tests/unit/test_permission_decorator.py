"""
Unit Tests for Permission Decorator

This module tests the @require_permission decorator to ensure it properly
enforces access control in FastAPI endpoints.

Requirements:
- 2.6: Implement role-based access control for Owner, Co-founder, Manager, Analyst, and Guest roles
- 2.7: Restrict financial data access based on User role permissions
"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from fastapi import Request, HTTPException
from starlette.datastructures import State

from app.models.role import Permission
from app.core.permissions import require_permission, PermissionDeniedError


class TestRequirePermissionDecorator:
    """Test the @require_permission decorator."""
    
    @pytest.mark.asyncio
    async def test_decorator_allows_access_with_permission(self):
        """Test that decorator allows access when user has required permission."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user who has permission
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "role": "owner",
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should not raise exception
        result = await test_endpoint(request)
        assert result == {"success": True}
    
    @pytest.mark.asyncio
    async def test_decorator_denies_access_without_permission(self):
        """Test that decorator denies access when user lacks required permission."""
        
        @require_permission(Permission.EDIT_FINANCIALS)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user who lacks permission (analyst)
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "analyst@example.com",
            "role": "analyst",
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should raise PermissionDeniedError
        with pytest.raises(PermissionDeniedError) as exc_info:
            await test_endpoint(request)
        
        assert exc_info.value.status_code == 403
    
    @pytest.mark.asyncio
    async def test_decorator_requires_authentication(self):
        """Test that decorator requires user to be authenticated."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request without user
        request = Mock(spec=Request)
        request.state = State()
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should raise HTTPException with 401
        with pytest.raises(HTTPException) as exc_info:
            await test_endpoint(request)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.asyncio
    async def test_decorator_with_multiple_permissions(self):
        """Test decorator with multiple required permissions."""
        
        @require_permission(Permission.VIEW_FINANCIALS, Permission.EXPORT_DATA)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user who has both permissions (owner)
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "owner@example.com",
            "role": "owner",
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/export/financial"
        
        # Should not raise exception
        result = await test_endpoint(request)
        assert result == {"success": True}
    
    @pytest.mark.asyncio
    async def test_decorator_denies_with_partial_permissions(self):
        """Test that decorator denies access when user has only some of required permissions."""
        
        @require_permission(Permission.VIEW_FINANCIALS, Permission.EXPORT_DATA)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user who has VIEW_FINANCIALS but not EXPORT_DATA (analyst)
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "analyst@example.com",
            "role": "analyst",
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/export/financial"
        
        # Should raise PermissionDeniedError
        with pytest.raises(PermissionDeniedError) as exc_info:
            await test_endpoint(request)
        
        assert exc_info.value.status_code == 403
    
    def test_decorator_with_sync_function(self):
        """Test that decorator works with synchronous functions."""
        
        @require_permission(Permission.VIEW_PRODUCTS)
        def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "user@example.com",
            "role": "guest",
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/products/search"
        
        # Should not raise exception
        result = test_endpoint(request)
        assert result == {"success": True}
    
    @pytest.mark.asyncio
    async def test_decorator_with_explicit_permissions_dict(self):
        """Test decorator with user having explicit permissions dict."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def test_endpoint(request: Request):
            return {"success": True}
        
        # Create mock request with user having explicit permissions
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {
            "user_id": str(uuid4()),
            "email": "custom@example.com",
            "permissions": {
                "view_financials": True,
                "edit_financials": False,
                "view_blueprints": True,
                "edit_blueprints": False,
                "manage_team": False,
                "export_data": False,
            },
        }
        request.state.user_id = request.state.user["user_id"]
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should not raise exception
        result = await test_endpoint(request)
        assert result == {"success": True}


class TestPermissionDeniedError:
    """Test the PermissionDeniedError exception."""
    
    def test_error_with_single_permission(self):
        """Test error message with single permission."""
        error = PermissionDeniedError(permission=Permission.VIEW_FINANCIALS)
        
        assert error.status_code == 403
        assert "view_financials" in str(error.detail)
    
    def test_error_with_multiple_permissions(self):
        """Test error message with multiple permissions."""
        error = PermissionDeniedError(
            permission=[Permission.VIEW_FINANCIALS, Permission.EXPORT_DATA]
        )
        
        assert error.status_code == 403
        assert "view_financials" in str(error.detail)
        assert "export_data" in str(error.detail)
    
    def test_error_with_custom_detail(self):
        """Test error with custom detail message."""
        error = PermissionDeniedError(detail="Custom error message")
        
        assert error.status_code == 403
        assert "Custom error message" in str(error.detail)
    
    def test_error_without_permission(self):
        """Test error without specifying permission."""
        error = PermissionDeniedError()
        
        assert error.status_code == 403
        assert "Insufficient permissions" in str(error.detail)


class TestRoleBasedFinancialAccess:
    """
    Integration tests for role-based financial data access.
    
    This validates Requirement 2.7: Restrict financial data access based on
    User role permissions.
    """
    
    @pytest.mark.asyncio
    async def test_owner_can_access_financial_endpoint(self):
        """Test that owner can access financial endpoints."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def get_financials(request: Request):
            return {"data": "financial_data"}
        
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {"role": "owner"}
        request.state.user_id = str(uuid4())
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        result = await get_financials(request)
        assert result == {"data": "financial_data"}
    
    @pytest.mark.asyncio
    async def test_analyst_can_view_but_not_edit_financials(self):
        """Test that analyst can view but not edit financial data."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def view_financials(request: Request):
            return {"data": "financial_data"}
        
        @require_permission(Permission.EDIT_FINANCIALS)
        async def edit_financials(request: Request):
            return {"success": True}
        
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {"role": "analyst"}
        request.state.user_id = str(uuid4())
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should be able to view
        result = await view_financials(request)
        assert result == {"data": "financial_data"}
        
        # Should not be able to edit
        with pytest.raises(PermissionDeniedError):
            await edit_financials(request)
    
    @pytest.mark.asyncio
    async def test_guest_cannot_access_financial_endpoints(self):
        """Test that guest cannot access financial endpoints."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def get_financials(request: Request):
            return {"data": "financial_data"}
        
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {"role": "guest"}
        request.state.user_id = str(uuid4())
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        with pytest.raises(PermissionDeniedError) as exc_info:
            await get_financials(request)
        
        assert exc_info.value.status_code == 403
    
    @pytest.mark.asyncio
    async def test_manager_can_access_and_edit_financials(self):
        """Test that manager can access and edit financial data."""
        
        @require_permission(Permission.VIEW_FINANCIALS)
        async def view_financials(request: Request):
            return {"data": "financial_data"}
        
        @require_permission(Permission.EDIT_FINANCIALS)
        async def edit_financials(request: Request):
            return {"success": True}
        
        request = Mock(spec=Request)
        request.state = State()
        request.state.user = {"role": "manager"}
        request.state.user_id = str(uuid4())
        request.url = Mock()
        request.url.path = "/api/v1/financial/entries"
        
        # Should be able to view
        result = await view_financials(request)
        assert result == {"data": "financial_data"}
        
        # Should be able to edit
        result = await edit_financials(request)
        assert result == {"success": True}


class TestTeamManagementAccess:
    """Test team management permission enforcement."""
    
    @pytest.mark.asyncio
    async def test_only_owner_can_manage_team(self):
        """Test that only owner can manage team."""
        
        @require_permission(Permission.MANAGE_TEAM)
        async def manage_team(request: Request):
            return {"success": True}
        
        # Owner should succeed
        owner_request = Mock(spec=Request)
        owner_request.state = State()
        owner_request.state.user = {"role": "owner"}
        owner_request.state.user_id = str(uuid4())
        owner_request.url = Mock()
        owner_request.url.path = "/api/v1/workspaces/members"
        
        result = await manage_team(owner_request)
        assert result == {"success": True}
        
        # Co-founder should fail
        cofounder_request = Mock(spec=Request)
        cofounder_request.state = State()
        cofounder_request.state.user = {"role": "co_founder"}
        cofounder_request.state.user_id = str(uuid4())
        cofounder_request.url = Mock()
        cofounder_request.url.path = "/api/v1/workspaces/members"
        
        with pytest.raises(PermissionDeniedError):
            await manage_team(cofounder_request)
        
        # Manager should fail
        manager_request = Mock(spec=Request)
        manager_request.state = State()
        manager_request.state.user = {"role": "manager"}
        manager_request.state.user_id = str(uuid4())
        manager_request.url = Mock()
        manager_request.url.path = "/api/v1/workspaces/members"
        
        with pytest.raises(PermissionDeniedError):
            await manage_team(manager_request)
