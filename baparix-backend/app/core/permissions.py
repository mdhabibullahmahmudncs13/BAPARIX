"""
Permission Checking Decorators and Utilities

This module provides decorators and utilities for enforcing role-based
access control in FastAPI endpoints.

Requirements:
- 2.6: Implement role-based access control for Owner, Co-founder, Manager, Analyst, and Guest roles
- 2.7: Restrict financial data access based on User role permissions
"""

from functools import wraps
from typing import Callable, List, Optional, Union

import structlog
from fastapi import HTTPException, Request, status

from app.models.role import Permission

logger = structlog.get_logger(__name__)


class PermissionDeniedError(HTTPException):
    """
    Exception raised when a user lacks required permissions.
    """
    
    def __init__(
        self,
        permission: Optional[Union[Permission, List[Permission]]] = None,
        detail: Optional[str] = None,
    ):
        if detail is None:
            if permission:
                if isinstance(permission, list):
                    perm_names = ", ".join([p.value for p in permission])
                    detail = f"Insufficient permissions. Required: {perm_names}"
                else:
                    detail = f"Insufficient permissions. Required: {permission.value}"
            else:
                detail = "Insufficient permissions to access this resource"
        
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "PERMISSION_DENIED",
                    "message": detail,
                },
            },
        )


def require_permission(*permissions: Permission):
    """
    Decorator to require specific permissions for an endpoint.
    
    This decorator checks if the authenticated user has the required permissions
    before allowing access to the endpoint. It expects the request object to have
    a `state.user` attribute with permission information.
    
    Usage:
        @app.get("/api/v1/financial/entries")
        @require_permission(Permission.VIEW_FINANCIALS)
        async def get_financial_entries(request: Request):
            # Endpoint logic here
            pass
        
        @app.post("/api/v1/financial/entries")
        @require_permission(Permission.EDIT_FINANCIALS)
        async def create_financial_entry(request: Request):
            # Endpoint logic here
            pass
        
        @app.post("/api/v1/workspaces/{workspace_id}/members")
        @require_permission(Permission.MANAGE_TEAM)
        async def invite_team_member(request: Request, workspace_id: str):
            # Endpoint logic here
            pass
    
    Args:
        *permissions: One or more Permission enum values required for access
    
    Raises:
        PermissionDeniedError: If user lacks required permissions
    
    Returns:
        Callable: Decorated function
    """
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract request from args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request is None:
                request = kwargs.get("request")
            
            if request is None:
                logger.error(
                    "permission_check_failed_no_request",
                    endpoint=func.__name__,
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal server error: Request object not found",
                )
            
            # Check if user is authenticated
            if not hasattr(request.state, "user") or request.state.user is None:
                logger.warning(
                    "permission_check_failed_no_user",
                    endpoint=func.__name__,
                    path=request.url.path,
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "success": False,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Authentication required",
                        },
                    },
                )
            
            user = request.state.user
            user_id = request.state.user_id
            
            # Check permissions
            user_permissions = _get_user_permissions(user)
            
            missing_permissions = []
            for permission in permissions:
                if permission not in user_permissions:
                    missing_permissions.append(permission)
            
            if missing_permissions:
                logger.warning(
                    "permission_denied",
                    user_id=user_id,
                    endpoint=func.__name__,
                    required_permissions=[p.value for p in permissions],
                    missing_permissions=[p.value for p in missing_permissions],
                    path=request.url.path,
                )
                raise PermissionDeniedError(permission=list(permissions))
            
            logger.debug(
                "permission_check_passed",
                user_id=user_id,
                endpoint=func.__name__,
                required_permissions=[p.value for p in permissions],
            )
            
            # Call the original function
            return await func(*args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Extract request from args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request is None:
                request = kwargs.get("request")
            
            if request is None:
                logger.error(
                    "permission_check_failed_no_request",
                    endpoint=func.__name__,
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal server error: Request object not found",
                )
            
            # Check if user is authenticated
            if not hasattr(request.state, "user") or request.state.user is None:
                logger.warning(
                    "permission_check_failed_no_user",
                    endpoint=func.__name__,
                    path=request.url.path,
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "success": False,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Authentication required",
                        },
                    },
                )
            
            user = request.state.user
            user_id = request.state.user_id
            
            # Check permissions
            user_permissions = _get_user_permissions(user)
            
            missing_permissions = []
            for permission in permissions:
                if permission not in user_permissions:
                    missing_permissions.append(permission)
            
            if missing_permissions:
                logger.warning(
                    "permission_denied",
                    user_id=user_id,
                    endpoint=func.__name__,
                    required_permissions=[p.value for p in permissions],
                    missing_permissions=[p.value for p in missing_permissions],
                    path=request.url.path,
                )
                raise PermissionDeniedError(permission=list(permissions))
            
            logger.debug(
                "permission_check_passed",
                user_id=user_id,
                endpoint=func.__name__,
                required_permissions=[p.value for p in permissions],
            )
            
            # Call the original function
            return func(*args, **kwargs)
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def _get_user_permissions(user: dict) -> set:
    """
    Extract permissions from user object.
    
    The user object can have permissions in different formats:
    1. As a 'permissions' dict with boolean values
    2. As a 'role' string that maps to default permissions
    
    Args:
        user: User object from request.state.user
    
    Returns:
        set: Set of Permission enum values the user has
    """
    permissions = set()
    
    # Check if user has explicit permissions dict
    if "permissions" in user and isinstance(user["permissions"], dict):
        perm_dict = user["permissions"]
        
        if perm_dict.get("view_financials"):
            permissions.add(Permission.VIEW_FINANCIALS)
        if perm_dict.get("edit_financials"):
            permissions.add(Permission.EDIT_FINANCIALS)
        if perm_dict.get("view_blueprints"):
            permissions.add(Permission.VIEW_BLUEPRINTS)
        if perm_dict.get("edit_blueprints"):
            permissions.add(Permission.EDIT_BLUEPRINTS)
        if perm_dict.get("manage_team"):
            permissions.add(Permission.MANAGE_TEAM)
        if perm_dict.get("export_data"):
            permissions.add(Permission.EXPORT_DATA)
        if perm_dict.get("view_products", True):  # Default to True
            permissions.add(Permission.VIEW_PRODUCTS)
        if perm_dict.get("edit_products", True):  # Default to True
            permissions.add(Permission.EDIT_PRODUCTS)
    
    # Check if user has role-based permissions
    elif "role" in user:
        from app.models.role import RoleType, get_role_permissions
        
        role_str = user["role"]
        try:
            role = RoleType(role_str)
            permissions = get_role_permissions(role)
        except ValueError:
            logger.warning(
                "invalid_role_in_user_object",
                role=role_str,
            )
    
    # Default permissions for authenticated users
    else:
        # All authenticated users can view and edit products
        permissions.add(Permission.VIEW_PRODUCTS)
        permissions.add(Permission.EDIT_PRODUCTS)
    
    return permissions


def check_user_permission(user: dict, permission: Permission) -> bool:
    """
    Check if a user has a specific permission.
    
    This is a utility function for checking permissions outside of decorators.
    
    Args:
        user: User object with permission information
        permission: The permission to check
    
    Returns:
        bool: True if user has the permission, False otherwise
    """
    user_permissions = _get_user_permissions(user)
    return permission in user_permissions


def get_user_permissions_list(user: dict) -> List[str]:
    """
    Get a list of permission strings for a user.
    
    This is useful for returning permission information in API responses.
    
    Args:
        user: User object with permission information
    
    Returns:
        List[str]: List of permission strings (e.g., ["view_financials", "edit_financials"])
    """
    user_permissions = _get_user_permissions(user)
    return [p.value for p in user_permissions]
