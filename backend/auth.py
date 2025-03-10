from fastapi import Depends, HTTPException, status, Header
from backend.firebase import firebase_manager
import logging

# Настройка логирования
logger = logging.getLogger('auth')

# Кэш для токенов
token_cache = {}

async def get_current_user(authorization: str = Header(None)):
    """
    Получение текущего пользователя по токену авторизации.
    
    Args:
        authorization: Заголовок Authorization с токеном.
        
    Returns:
        ID пользователя.
        
    Raises:
        HTTPException: Если токен отсутствует или недействителен.
    """
    if not authorization:
        logger.warning("Authorization header is missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверка формата заголовка Authorization
    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication format. Use Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    # Проверка токена в кэше
    if token in token_cache:
        return token_cache[token]
    
    try:
        # Проверка токена через FirebaseManager
        decoded_token = firebase_manager.verify_token(token)
        uid = decoded_token["uid"]
        
        # Сохранение в кэше
        token_cache[token] = uid
        
        return uid
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
