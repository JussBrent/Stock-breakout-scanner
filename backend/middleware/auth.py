"""
JWT Authentication middleware for Supabase tokens.
Verifies JWT tokens from Supabase Auth and extracts user information.
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
import os
import httpx
from functools import lru_cache

security = HTTPBearer()

# Supabase JWT settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


@lru_cache()
def get_jwt_secret() -> str:
    """
    Get JWT secret from environment or fetch from Supabase.
    The JWT secret is needed to verify tokens.
    """
    if SUPABASE_JWT_SECRET:
        return SUPABASE_JWT_SECRET

    # If not set, we need to get it from Supabase project settings
    # For now, raise an error to remind user to set it
    raise ValueError(
        "SUPABASE_JWT_SECRET not set. Get it from: "
        "Supabase Dashboard > Settings > API > JWT Secret"
    )


async def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT token and return payload.

    Args:
        token: JWT token string

    Returns:
        dict: Token payload with user info

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        jwt_secret = get_jwt_secret()

        # Decode and verify JWT token
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials) -> dict:
    """
    Dependency to get current authenticated user from JWT token.

    Usage:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            return {"user_id": user["sub"]}

    Args:
        credentials: HTTP Authorization credentials

    Returns:
        dict: User information from token payload

    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = await verify_token(token)

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "metadata": payload.get("user_metadata", {})
    }


async def get_current_user_optional(
    request: Request
) -> Optional[dict]:
    """
    Optional authentication - returns user if token is present and valid,
    otherwise returns None. Useful for endpoints that work with or without auth.

    Usage:
        @app.get("/endpoint")
        async def endpoint(user: Optional[dict] = Depends(get_current_user_optional)):
            if user:
                # User is authenticated
                return {"message": f"Hello {user['email']}"}
            else:
                # Anonymous access
                return {"message": "Hello anonymous"}
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.replace("Bearer ", "")
        payload = await verify_token(token)

        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "metadata": payload.get("user_metadata", {})
        }
    except:
        return None


def require_role(required_role: str):
    """
    Decorator to require a specific role for an endpoint.

    Usage:
        @app.get("/admin")
        async def admin_route(user: dict = Depends(require_role("admin"))):
            return {"message": "Admin access"}
    """
    async def role_checker(credentials: HTTPAuthorizationCredentials) -> dict:
        user = await get_current_user(credentials)

        if user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )

        return user

    return role_checker