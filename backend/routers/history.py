from fastapi import APIRouter, Depends, HTTPException, status, Response
from backend.models import HistoryEntry, HistoryList
from backend.auth import get_current_user
from backend.firebase import firebase_manager
import logging
from typing import Dict, Any
import time

# Настройка логирования
logger = logging.getLogger('history_router')

# Кэш для ответов
response_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5 минут в секундах

router = APIRouter(
    tags=["history"]
)

@router.get("/history", response_model=HistoryList)
async def get_history(
    response: Response, 
    limit: int = 20, 
    offset: int = 0, 
    user_id: str = Depends(get_current_user)
):
    """
    Get history entries for the current user.
    """
    # Проверка кэша
    cache_key = f"history_list_{user_id}_{limit}_{offset}"
    current_time = time.time()
    
    if cache_key in response_cache:
        cache_data = response_cache[cache_key]
        if current_time - cache_data["timestamp"] < CACHE_TTL:
            # Устанавливаем заголовок для кэширования на стороне клиента
            response.headers["X-Cache"] = "HIT"
            return cache_data["data"]
    
    # Получение данных из Firebase
    history_data = firebase_manager.get_user_history(user_id, limit, offset)
    result = HistoryList(history=history_data)
    
    # Сохранение в кэше
    response_cache[cache_key] = {
        "data": result,
        "timestamp": current_time
    }
    
    # Устанавливаем заголовок для кэширования на стороне клиента
    response.headers["Cache-Control"] = "private, max-age=300"
    response.headers["X-Cache"] = "MISS"
    
    return result

@router.post("/history", response_model=HistoryEntry)
async def add_history_entry(entry: HistoryEntry, user_id: str = Depends(get_current_user)):
    """
    Add a new history entry.
    """
    try:
        # Prepare history data for Firestore
        entry_data = entry.dict(exclude={"id", "userId", "timestamp"})
        entry_data["userId"] = user_id
        
        # Save to Firestore using FirebaseManager
        created_entry = firebase_manager.add_history_entry(entry_data)
        
        if not created_entry:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add history entry"
            )
        
        # Очистка кэша для списка истории
        # Очищаем все кэши, связанные с историей пользователя
        for key in list(response_cache.keys()):
            if key.startswith(f"history_list_{user_id}"):
                del response_cache[key]
        
        return HistoryEntry(**created_entry)
    except Exception as e:
        logger.error(f"Error adding history entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add history entry"
        )

@router.delete("/history/{entry_id}")
async def delete_history_entry(entry_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a history entry.
    """
    try:
        success = firebase_manager.delete_history_entry(entry_id, user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="History entry not found or you don't have permission to delete it"
            )
        
        # Очистка кэша
        # Очищаем все кэши, связанные с историей пользователя
        for key in list(response_cache.keys()):
            if key.startswith(f"history_list_{user_id}"):
                del response_cache[key]
        
        return {"message": "History entry deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting history entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete history entry"
        )

@router.delete("/history")
async def clear_history(user_id: str = Depends(get_current_user)):
    """
    Clear all history entries for the current user.
    """
    try:
        success = firebase_manager.clear_user_history(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear history"
            )
        
        # Очистка кэша
        # Очищаем все кэши, связанные с историей пользователя
        for key in list(response_cache.keys()):
            if key.startswith(f"history_list_{user_id}"):
                del response_cache[key]
        
        return {"message": "History cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear history"
        )
