"""
Global error handling middleware for FastAPI.
Provides consistent error responses and logging.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from typing import Union

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle HTTP exceptions with consistent format.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error"
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors with detailed field information.
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation error",
                "type": "validation_error",
                "details": errors
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unexpected exceptions.
    Logs full traceback and returns safe error message to client.
    """
    # Log the full error with traceback
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=True
    )

    # In production, don't expose internal error details
    # In development, include more information
    import os
    is_development = os.getenv("ENVIRONMENT", "production").lower() in ["development", "dev", "local"]

    error_detail = {
        "success": False,
        "error": {
            "code": 500,
            "message": "Internal server error",
            "type": "internal_error"
        }
    }

    # Add debug info in development
    if is_development:
        error_detail["error"]["debug"] = {
            "exception": str(exc),
            "traceback": traceback.format_exc()
        }

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_detail
    )


class APIError(Exception):
    """
    Custom API error with status code and detail.

    Usage:
        raise APIError(
            status_code=404,
            message="Resource not found",
            error_code="RESOURCE_NOT_FOUND"
        )
    """
    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str = None,
        details: dict = None
    ):
        self.status_code = status_code
        self.message = message
        self.error_code = error_code or f"ERROR_{status_code}"
        self.details = details or {}
        super().__init__(self.message)


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """
    Handle custom APIError exceptions.
    """
    content = {
        "success": False,
        "error": {
            "code": exc.status_code,
            "message": exc.message,
            "type": exc.error_code
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )


def register_error_handlers(app):
    """
    Register all error handlers with the FastAPI app.

    Usage:
        from middleware.error_handler import register_error_handlers
        register_error_handlers(app)
    """
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)