"""
Unit Tests for Role-Based Access Control (RBAC)

This module tests the Permission enum, Role model, and permission checking
decorator to ensure proper access control enforcement.

Requirements:
- 2.6: Implement role-based access control for Owner, Co-founder, Manager, Analyst, and Guest roles
- 2.7: Restrict financial data access based on User role permissions
"""

import pytest
from uuid import uuid4

from app.models.role import (
    Permission,
    RoleType,
    WorkspaceMember,
    ROLE_PERMISSIONS,
    get_role_permissions,
    check_permission,
)
from app.core.permissions import (
    check_user_permission,
    get_user_permissions_list,
    _get_user_permissions,
)


class TestPermissionEnum:
    """Test the Permission enum."""
    
    def test_permission_enum_values(self):
        """Test that all expected permissions are defined."""
        assert Permission.VIEW_FINANCIALS.value == "view_financials"
        assert Permission.EDIT_FINANCIALS.value == "edit_financials"
        assert Permission.VIEW_BLUEPRINTS.value == "view_blueprints"
        assert Permission.EDIT_BLUEPRINTS.value == "edit_blueprints"
        assert Permission.MANAGE_TEAM.value == "manage_team"
        assert Permission.EXPORT_DATA.value == "export_data"
        assert Permission.VIEW_PRODUCTS.value == "view_products"
        assert Permission.EDIT_PRODUCTS.value == "edit_products"
    
    def test_permission_enum_count(self):
        """Test that we have the expected number of permissions."""
        permissions = list(Permission)
        assert len(permissions) == 8


class TestRoleType:
    """Test the RoleType enum."""
    
    def test_role_type_values(self):
        """Test that all expected roles are defined."""
        assert RoleType.OWNER.value == "owner"
        assert RoleType.CO_FOUNDER.value == "co_founder"
        assert RoleType.MANAGER.value == "manager"
        assert RoleType.ANALYST.value == "analyst"
        assert RoleType.GUEST.value == "guest"
    
    def test_role_type_count(self):
        """Test that we have the expected number of roles."""
        roles = list(RoleType)
        assert len(roles) == 5


class TestRolePermissions:
    """Test the role to permissions mapping."""
    
    def test_owner_permissions(self):
        """Test that owner has all permissions."""
        permissions = ROLE_PERMISSIONS[RoleType.OWNER]
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS in permissions
        assert Permission.MANAGE_TEAM in permissions
        assert Permission.EXPORT_DATA in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions
        
        # Owner should have all 8 permissions
        assert len(permissions) == 8
    
    def test_co_founder_permissions(self):
        """Test that co-founder has most permissions except MANAGE_TEAM."""
        permissions = ROLE_PERMISSIONS[RoleType.CO_FOUNDER]
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS in permissions
        assert Permission.MANAGE_TEAM not in permissions  # Cannot manage team
        assert Permission.EXPORT_DATA in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions
        
        assert len(permissions) == 7
    
    def test_manager_permissions(self):
        """Test that manager has operational permissions."""
        permissions = ROLE_PERMISSIONS[RoleType.MANAGER]
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS in permissions
        assert Permission.MANAGE_TEAM not in permissions
        assert Permission.EXPORT_DATA not in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions
        
        assert len(permissions) == 6
    
    def test_analyst_permissions(self):
        """Test that analyst has read-only permissions."""
        permissions = ROLE_PERMISSIONS[RoleType.ANALYST]
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS not in permissions  # Read-only
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS not in permissions  # Read-only
        assert Permission.MANAGE_TEAM not in permissions
        assert Permission.EXPORT_DATA not in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS not in permissions  # Read-only
        
        assert len(permissions) == 3
    
    def test_guest_permissions(self):
        """Test that guest has minimal permissions."""
        permissions = ROLE_PERMISSIONS[RoleType.GUEST]
        
        assert Permission.VIEW_FINANCIALS not in permissions
        assert Permission.EDIT_FINANCIALS not in permissions
        assert Permission.VIEW_BLUEPRINTS not in permissions
        assert Permission.EDIT_BLUEPRINTS not in permissions
        assert Permission.MANAGE_TEAM not in permissions
        assert Permission.EXPORT_DATA not in permissions
        assert Permission.VIEW_PRODUCTS in permissions  # Can view products
        assert Permission.EDIT_PRODUCTS not in permissions
        
        assert len(permissions) == 1
    
    def test_get_role_permissions(self):
        """Test the get_role_permissions utility function."""
        owner_perms = get_role_permissions(RoleType.OWNER)
        assert len(owner_perms) == 8
        
        guest_perms = get_role_permissions(RoleType.GUEST)
        assert len(guest_perms) == 1
    
    def test_check_permission(self):
        """Test the check_permission utility function."""
        # Owner should have all permissions
        assert check_permission(RoleType.OWNER, Permission.VIEW_FINANCIALS) is True
        assert check_permission(RoleType.OWNER, Permission.MANAGE_TEAM) is True
        
        # Guest should only have VIEW_PRODUCTS
        assert check_permission(RoleType.GUEST, Permission.VIEW_PRODUCTS) is True
        assert check_permission(RoleType.GUEST, Permission.VIEW_FINANCIALS) is False
        
        # Analyst should have view but not edit permissions
        assert check_permission(RoleType.ANALYST, Permission.VIEW_FINANCIALS) is True
        assert check_permission(RoleType.ANALYST, Permission.EDIT_FINANCIALS) is False


class TestWorkspaceMember:
    """Test the WorkspaceMember model."""
    
    def test_create_workspace_member(self):
        """Test creating a workspace member with explicit permissions."""
        workspace_id = uuid4()
        user_id = uuid4()
        
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role="owner",
            view_financials=True,
            edit_financials=True,
            view_blueprints=True,
            edit_blueprints=True,
            manage_team=True,
            export_data=True,
        )
        
        assert member.workspace_id == workspace_id
        assert member.user_id == user_id
        assert member.role == "owner"
        assert member.view_financials is True
        assert member.edit_financials is True
        assert member.manage_team is True
    
    def test_create_with_role_owner(self):
        """Test creating a workspace member with owner role."""
        workspace_id = uuid4()
        user_id = uuid4()
        
        member = WorkspaceMember.create_with_role(
            workspace_id=workspace_id,
            user_id=user_id,
            role=RoleType.OWNER,
        )
        
        assert member.workspace_id == workspace_id
        assert member.user_id == user_id
        assert member.role == "owner"
        assert member.view_financials is True
        assert member.edit_financials is True
        assert member.view_blueprints is True
        assert member.edit_blueprints is True
        assert member.manage_team is True
        assert member.export_data is True
    
    def test_create_with_role_analyst(self):
        """Test creating a workspace member with analyst role."""
        workspace_id = uuid4()
        user_id = uuid4()
        
        member = WorkspaceMember.create_with_role(
            workspace_id=workspace_id,
            user_id=user_id,
            role=RoleType.ANALYST,
        )
        
        assert member.role == "analyst"
        assert member.view_financials is True
        assert member.edit_financials is False  # Analyst cannot edit
        assert member.view_blueprints is True
        assert member.edit_blueprints is False  # Analyst cannot edit
        assert member.manage_team is False
        assert member.export_data is False
    
    def test_create_with_role_guest(self):
        """Test creating a workspace member with guest role."""
        workspace_id = uuid4()
        user_id = uuid4()
        
        member = WorkspaceMember.create_with_role(
            workspace_id=workspace_id,
            user_id=user_id,
            role=RoleType.GUEST,
        )
        
        assert member.role == "guest"
        assert member.view_financials is False
        assert member.edit_financials is False
        assert member.view_blueprints is False
        assert member.edit_blueprints is False
        assert member.manage_team is False
        assert member.export_data is False
    
    def test_has_permission(self):
        """Test the has_permission method."""
        member = WorkspaceMember.create_with_role(
            workspace_id=uuid4(),
            user_id=uuid4(),
            role=RoleType.MANAGER,
        )
        
        assert member.has_permission(Permission.VIEW_FINANCIALS) is True
        assert member.has_permission(Permission.EDIT_FINANCIALS) is True
        assert member.has_permission(Permission.MANAGE_TEAM) is False
        assert member.has_permission(Permission.VIEW_PRODUCTS) is True
    
    def test_get_permissions(self):
        """Test the get_permissions method."""
        member = WorkspaceMember.create_with_role(
            workspace_id=uuid4(),
            user_id=uuid4(),
            role=RoleType.CO_FOUNDER,
        )
        
        permissions = member.get_permissions()
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS in permissions
        assert Permission.MANAGE_TEAM not in permissions  # Co-founder cannot manage team
        assert Permission.EXPORT_DATA in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions


class TestPermissionUtilities:
    """Test permission utility functions."""
    
    def test_get_user_permissions_from_dict(self):
        """Test extracting permissions from user dict with permissions field."""
        user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "permissions": {
                "view_financials": True,
                "edit_financials": True,
                "view_blueprints": True,
                "edit_blueprints": False,
                "manage_team": False,
                "export_data": True,
            },
        }
        
        permissions = _get_user_permissions(user)
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS not in permissions
        assert Permission.MANAGE_TEAM not in permissions
        assert Permission.EXPORT_DATA in permissions
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions
    
    def test_get_user_permissions_from_role(self):
        """Test extracting permissions from user dict with role field."""
        user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "role": "analyst",
        }
        
        permissions = _get_user_permissions(user)
        
        assert Permission.VIEW_FINANCIALS in permissions
        assert Permission.EDIT_FINANCIALS not in permissions
        assert Permission.VIEW_BLUEPRINTS in permissions
        assert Permission.EDIT_BLUEPRINTS not in permissions
        assert Permission.VIEW_PRODUCTS in permissions
    
    def test_get_user_permissions_default(self):
        """Test default permissions for user without explicit permissions or role."""
        user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
        }
        
        permissions = _get_user_permissions(user)
        
        # Default: can view and edit products
        assert Permission.VIEW_PRODUCTS in permissions
        assert Permission.EDIT_PRODUCTS in permissions
        assert len(permissions) == 2
    
    def test_check_user_permission(self):
        """Test the check_user_permission utility function."""
        user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "role": "owner",
        }
        
        assert check_user_permission(user, Permission.VIEW_FINANCIALS) is True
        assert check_user_permission(user, Permission.MANAGE_TEAM) is True
        
        guest_user = {
            "user_id": str(uuid4()),
            "email": "guest@example.com",
            "role": "guest",
        }
        
        assert check_user_permission(guest_user, Permission.VIEW_PRODUCTS) is True
        assert check_user_permission(guest_user, Permission.VIEW_FINANCIALS) is False
    
    def test_get_user_permissions_list(self):
        """Test the get_user_permissions_list utility function."""
        user = {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "role": "manager",
        }
        
        permissions_list = get_user_permissions_list(user)
        
        assert "view_financials" in permissions_list
        assert "edit_financials" in permissions_list
        assert "view_blueprints" in permissions_list
        assert "edit_blueprints" in permissions_list
        assert "manage_team" not in permissions_list
        assert "view_products" in permissions_list
        assert "edit_products" in permissions_list
        
        assert len(permissions_list) == 6


class TestFinancialAccessRestriction:
    """
    Test that financial data access is properly restricted based on role.
    
    This validates Requirement 2.7: Restrict financial data access based on
    User role permissions.
    """
    
    def test_owner_can_view_financials(self):
        """Test that owner can view financial data."""
        user = {"role": "owner"}
        assert check_user_permission(user, Permission.VIEW_FINANCIALS) is True
    
    def test_owner_can_edit_financials(self):
        """Test that owner can edit financial data."""
        user = {"role": "owner"}
        assert check_user_permission(user, Permission.EDIT_FINANCIALS) is True
    
    def test_analyst_can_view_financials(self):
        """Test that analyst can view financial data."""
        user = {"role": "analyst"}
        assert check_user_permission(user, Permission.VIEW_FINANCIALS) is True
    
    def test_analyst_cannot_edit_financials(self):
        """Test that analyst cannot edit financial data."""
        user = {"role": "analyst"}
        assert check_user_permission(user, Permission.EDIT_FINANCIALS) is False
    
    def test_guest_cannot_view_financials(self):
        """Test that guest cannot view financial data."""
        user = {"role": "guest"}
        assert check_user_permission(user, Permission.VIEW_FINANCIALS) is False
    
    def test_guest_cannot_edit_financials(self):
        """Test that guest cannot edit financial data."""
        user = {"role": "guest"}
        assert check_user_permission(user, Permission.EDIT_FINANCIALS) is False
    
    def test_manager_can_view_and_edit_financials(self):
        """Test that manager can view and edit financial data."""
        user = {"role": "manager"}
        assert check_user_permission(user, Permission.VIEW_FINANCIALS) is True
        assert check_user_permission(user, Permission.EDIT_FINANCIALS) is True


class TestTeamManagementPermission:
    """Test team management permission restrictions."""
    
    def test_owner_can_manage_team(self):
        """Test that owner can manage team."""
        user = {"role": "owner"}
        assert check_user_permission(user, Permission.MANAGE_TEAM) is True
    
    def test_co_founder_cannot_manage_team(self):
        """Test that co-founder cannot manage team."""
        user = {"role": "co_founder"}
        assert check_user_permission(user, Permission.MANAGE_TEAM) is False
    
    def test_manager_cannot_manage_team(self):
        """Test that manager cannot manage team."""
        user = {"role": "manager"}
        assert check_user_permission(user, Permission.MANAGE_TEAM) is False
    
    def test_analyst_cannot_manage_team(self):
        """Test that analyst cannot manage team."""
        user = {"role": "analyst"}
        assert check_user_permission(user, Permission.MANAGE_TEAM) is False
    
    def test_guest_cannot_manage_team(self):
        """Test that guest cannot manage team."""
        user = {"role": "guest"}
        assert check_user_permission(user, Permission.MANAGE_TEAM) is False
