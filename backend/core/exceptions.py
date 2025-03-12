from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from typing import Dict, Any, List, Union

# Logger for exceptions
logger = logging.getLogger("exceptions")

class AppException(Exception):
    """
    Base exception for application-specific exceptions
    """
    def __init__(self, status_code: int, detail: str, headers: Dict[str, str] = None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers

class NotFoundException(AppException):
    """
    Exception for resource not found
    """
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class UnauthorizedException(AppException):
    """
    Exception for unauthorized access
    """
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

class ForbiddenException(AppException):
    """
    Exception for forbidden access
    """
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class BadRequestException(AppException):
    """
    Exception for bad request
    """
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handler for application-specific exceptions
    """
    logger.error(f"AppException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handler for HTTP exceptions
    """
    logger.error(f"HTTPException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handler for validation exceptions
    """
    errors = []
    for error in exc.errors():
        error_detail = {
            "loc": error.get("loc", []),
            "msg": error.get("msg", ""),
            "type": error.get("type", "")
        }
        errors.append(error_detail)
    
    logger.error(f"ValidationError: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors}
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler for general exceptions
    """
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

def setup_exception_handlers(app):
    """
    Set up exception handlers for the application
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
