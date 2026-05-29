"""
Role-Based Access Control (RBAC) Models

This module defines the Permission enum and Role model for implementing
role-based access control across the VentureOS platform.

Requirements:
- 2.6: Implement role-based access control for Owner, Co-founder, Manager, Analyst, and Guest roles
- 2.7: Restrict financial data access based on User role permissions
"""

from enum import Enum
from typing import Dict, Set
from uuid import UUID

from sqlalchemy import Boolean, Column, ForeignKey, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func

from app.db.postgres import Base


class Permission(str, Enum):
    """
    Permission enum defining granular access control permissions.
    
    Permissions are used to control access to specific features and data:
    - VIEW_FINANCIALS: View financial data (revenue, expenses, profit margins)
    - EDIT_FINANCIALS: Create, update, delete financial entries
    - VIEW_BLUEPRINTS: View business blueprints and plans
    - EDIT_BLUEPRINTS: Create, update, delete blueprints
    - MANAGE_TEAM: Invite, remove team members, change roles
    - EXPORT_DATA: Export data to CSV, PDF, JSON formats
    - VIEW_PRODUCTS: View product search results
    - EDIT_PRODUCTS: Save products, create product lists
    """
    
    VIEW_FINANCIALS = "view_financials"
    EDIT_FINANCIALS = "edit_financials"
    VIEW_BLUEPRINTS = "view_blueprints"
    EDIT_BLUEPRINTS = "edit_blueprints"
    MANAGE_TEAM = "manage_team"
    EXPORT_DATA = "export_data"
    VIEW_PRODUCTS = "view_products"
    EDIT_PRODUCTS = "edit_products"


class RoleType(str, Enum):
    """
    Role types defining user roles within a workspace.
    
    Roles:
    - OWNER: Full access to all features and data
    - CO_FOUNDER: Nearly full access, cannot remove owner
    - MANAGER: Can manage operations but not team structure
    - ANALYST: Read-only access to most data
    - GUEST: Limited read-only access
    """
    
    OWNER = "owner"
    CO_FOUNDER = "co_founder"
    MANAGER = "manager"
    ANALYST = "analyst"
    GUEST = "guest"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[RoleType, Set[Permission]] = {
    RoleType.OWNER: {
        Permission.VIEW_FINANCIALS,
        Permission.EDIT_FINANCIALS,
        Permission.VIEW_BLUEPRINTS,
        Permission.EDIT_BLUEPRINTS,
        Permission.MANAGE_TEAM,
        Permission.EXPORT_DATA,
        Permission.VIEW_PRODUCTS,
        Permission.EDIT_PRODUCTS,
    },
    RoleType.CO_FOUNDER: {
        Permission.VIEW_FINANCIALS,
        Permission.EDIT_FINANCIALS,
        Permission.VIEW_BLUEPRINTS,
        Permission.EDIT_BLUEPRINTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_PRODUCTS,
        Permission.EDIT_PRODUCTS,
    },
    RoleType.MANAGER: {
        Permission.VIEW_FINANCIALS,
        Permission.EDIT_FINANCIALS,
        Permission.VIEW_BLUEPRINTS,
        Permission.EDIT_BLUEPRINTS,
        Permission.VIEW_PRODUCTS,
        Permission.EDIT_PRODUCTS,
    },
    RoleType.ANALYST: {
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_BLUEPRINTS,
        Permission.VIEW_PRODUCTS,
    },
    RoleType.GUEST: {
        Permission.VIEW_PRODUCTS,
    },
}


class WorkspaceMember(Base):
    """
    SQLAlchemy model for workspace members with role-based permissions.
    
    This model represents a user's membership in a workspace with specific
    role and permissions. It supports the team collaboration features where
    multiple users can work together with different access levels.
    
    Attributes:
        id: Unique identifier for the workspace member
        workspace_id: Reference to the workspace
        user_id: Reference to the user
        role: User's role in the workspace (owner, co_founder, manager, analyst, guest)
        view_financials: Permission to view financial data
        edit_financials: Permission to edit financial data
        view_blueprints: Permission to view blueprints
        edit_blueprints: Permission to edit blueprints
        manage_team: Permission to manage team members
        export_data: Permission to export data
        joined_at: Timestamp when user joined the workspace
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    
    __tablename__ = "workspace_members"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    workspace_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    role = Column(String(20), nullable=False, index=True)
    
    # Permission flags
    view_financials = Column(Boolean, default=False, nullable=False)
    edit_financials = Column(Boolean, default=False, nullable=False)
    view_blueprints = Column(Boolean, default=False, nullable=False)
    edit_blueprints = Column(Boolean, default=False, nullable=False)
    manage_team = Column(Boolean, default=False, nullable=False)
    export_data = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    def __repr__(self) -> str:
        return f"<WorkspaceMember(id={self.id}, user_id={self.user_id}, role={self.role})>"
    
    def has_permission(self, permission: Permission) -> bool:
        """
        Check if this workspace member has a specific permission.
        
        Args:
            permission: The permission to check
        
        Returns:
            bool: True if the member has the permission, False otherwise
        """
        permission_map = {
            Permission.VIEW_FINANCIALS: self.view_financials,
            Permission.EDIT_FINANCIALS: self.edit_financials,
            Permission.VIEW_BLUEPRINTS: self.view_blueprints,
            Permission.EDIT_BLUEPRINTS: self.edit_blueprints,
            Permission.MANAGE_TEAM: self.manage_team,
            Permission.EXPORT_DATA: self.export_data,
            Permission.VIEW_PRODUCTS: True,  # All members can view products
            Permission.EDIT_PRODUCTS: True,  # All members can edit products
        }
        
        return permission_map.get(permission, False)
    
    def get_permissions(self) -> Set[Permission]:
        """
        Get all permissions for this workspace member.
        
        Returns:
            Set[Permission]: Set of permissions the member has
        """
        permissions = set()
        
        if self.view_financials:
            permissions.add(Permission.VIEW_FINANCIALS)
        if self.edit_financials:
            permissions.add(Permission.EDIT_FINANCIALS)
        if self.view_blueprints:
            permissions.add(Permission.VIEW_BLUEPRINTS)
        if self.edit_blueprints:
            permissions.add(Permission.EDIT_BLUEPRINTS)
        if self.manage_team:
            permissions.add(Permission.MANAGE_TEAM)
        if self.export_data:
            permissions.add(Permission.EXPORT_DATA)
        
        # All members can view and edit products
        permissions.add(Permission.VIEW_PRODUCTS)
        permissions.add(Permission.EDIT_PRODUCTS)
        
        return permissions
    
    @classmethod
    def create_with_role(
        cls,
        workspace_id: UUID,
        user_id: UUID,
        role: RoleType,
    ) -> "WorkspaceMember":
        """
        Create a workspace member with permissions based on role.
        
        Args:
            workspace_id: The workspace ID
            user_id: The user ID
            role: The role type
        
        Returns:
            WorkspaceMember: New workspace member instance with appropriate permissions
        """
        permissions = ROLE_PERMISSIONS.get(role, set())
        
        return cls(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role.value,
            view_financials=Permission.VIEW_FINANCIALS in permissions,
            edit_financials=Permission.EDIT_FINANCIALS in permissions,
            view_blueprints=Permission.VIEW_BLUEPRINTS in permissions,
            edit_blueprints=Permission.EDIT_BLUEPRINTS in permissions,
            manage_team=Permission.MANAGE_TEAM in permissions,
            export_data=Permission.EXPORT_DATA in permissions,
        )


def get_role_permissions(role: RoleType) -> Set[Permission]:
    """
    Get the set of permissions for a given role.
    
    Args:
        role: The role type
    
    Returns:
        Set[Permission]: Set of permissions for the role
    """
    return ROLE_PERMISSIONS.get(role, set())


def check_permission(role: RoleType, permission: Permission) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: The role type
        permission: The permission to check
    
    Returns:
        bool: True if the role has the permission, False otherwise
    """
    return permission in ROLE_PERMISSIONS.get(role, set())
