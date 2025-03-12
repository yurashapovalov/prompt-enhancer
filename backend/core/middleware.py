from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from typing import Callable
import uuid

# Logger for middleware
logger = logging.getLogger("middleware")

class TimingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for measuring request processing time
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Log request
        logger.debug(
            f"Request started: {request_id} - {request.method} {request.url.path}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Add processing time to response headers
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Request-ID"] = request_id
            
            # Log slow requests
            if process_time > 0.5:
                logger.warning(
                    f"Slow request: {request_id} - {request.method} {request.url.path} took {process_time:.2f}s"
                )
            else:
                logger.debug(
                    f"Request completed: {request_id} - {request.method} {request.url.path} took {process_time:.2f}s"
                )
            
            return response
        
        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log error
            logger.error(
                f"Request error: {request_id} - {request.method} {request.url.path} - {str(e)}"
            )
            
            # Re-raise exception
            raise

class CORSMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling CORS
    """
    def __init__(self, app, allow_origins=None, allow_methods=None, allow_headers=None):
        super().__init__(app)
        self.allow_origins = allow_origins or ["*"]
        self.allow_methods = allow_methods or ["*"]
        self.allow_headers = allow_headers or ["*"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Process request
        response = await call_next(request)
        
        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = ",".join(self.allow_origins)
        response.headers["Access-Control-Allow-Methods"] = ",".join(self.allow_methods)
        response.headers["Access-Control-Allow-Headers"] = ",".join(self.allow_headers)
        
        return response
