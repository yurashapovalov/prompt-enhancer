from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging
from typing import Optional

# Logger for authentication
logger = logging.getLogger("auth")

# Security scheme for Bearer token
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify Firebase ID token and return user ID
    
    Args:
        credentials: HTTP Authorization credentials
    
    Returns:
        User ID
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        # Verify token
        decoded_token = auth.verify_id_token(token)
        
        # Get user ID
        user_id = decoded_token.get("uid")
        
        if not user_id:
            logger.error("Token does not contain user ID")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.debug(f"Authenticated user: {user_id}")
        return user_id
    
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """
    Verify Firebase ID token and return user ID if token is valid, otherwise return None
    
    Args:
        credentials: HTTP Authorization credentials
    
    Returns:
        User ID or None if token is invalid
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        # Verify token
        decoded_token = auth.verify_id_token(token)
        
        # Get user ID
        user_id = decoded_token.get("uid")
        
        if not user_id:
            logger.warning("Token does not contain user ID")
            return None
        
        logger.debug(f"Authenticated user: {user_id}")
        return user_id
    
    except Exception as e:
        logger.warning(f"Authentication error: {str(e)}")
        return None
