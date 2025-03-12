from fastapi import APIRouter, Depends
from typing import Dict, Any
import logging
from ...config.settings import settings
from ..deps import OptionalUser

# Logger for root routes
logger = logging.getLogger("routes.root")

# Create router
router = APIRouter(
    tags=["root"],
)

@router.get("/", response_model=Dict[str, Any])
async def root(
    user_id: OptionalUser = None,
) -> Dict[str, Any]:
    """
    Root endpoint
    
    Args:
        user_id: Optional user ID
    
    Returns:
        API information
    """
    logger.debug(f"Root endpoint accessed by user: {user_id or 'anonymous'}")
    
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "authenticated": user_id is not None,
    }

@router.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint
    
    Returns:
        Health status
    """
    logger.debug("Health check endpoint accessed")
    
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
    }
