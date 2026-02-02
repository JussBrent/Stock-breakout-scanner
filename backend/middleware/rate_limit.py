"""
Rate limiting middleware using slowapi.
Protects API endpoints from abuse.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from typing import Callable

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)


def rate_limit_by_user(request: Request) -> str:
    """
    Rate limit based on authenticated user ID.
    Falls back to IP address for unauthenticated requests.
    """
    # Try to get user from auth header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            # Extract user_id from token (simplified)
            # In production, you'd decode the JWT token
            token = auth_header.replace("Bearer ", "")
            # For now, use the token hash as identifier
            return f"user_{hash(token)}"
        except:
            pass

    # Fallback to IP address
    return get_remote_address(request)


# Rate limit decorators for common use cases
# Usage: @router.get("/endpoint", dependencies=[Depends(rate_limit_10_per_minute)])

def rate_limit_10_per_minute(request: Request):
    """10 requests per minute."""
    return limiter.limit("10/minute")(lambda: None)()


def rate_limit_30_per_minute(request: Request):
    """30 requests per minute."""
    return limiter.limit("30/minute")(lambda: None)()


def rate_limit_100_per_hour(request: Request):
    """100 requests per hour."""
    return limiter.limit("100/hour")(lambda: None)()


def rate_limit_1000_per_day(request: Request):
    """1000 requests per day."""
    return limiter.limit("1000/day")(lambda: None)()


def setup_rate_limiting(app):
    """
    Configure rate limiting for the FastAPI app.

    Usage:
        from middleware.rate_limit import setup_rate_limiting
        setup_rate_limiting(app)
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Example usage in routes:
# from slowapi import Limiter
# from middleware.rate_limit import limiter
#
# @router.get("/expensive-operation")
# @limiter.limit("5/minute")
# async def expensive_operation(request: Request):
#     return {"message": "Success"}