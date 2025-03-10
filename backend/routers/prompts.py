from fastapi import APIRouter, Depends, HTTPException, status, Response
from backend.models import Prompt, PromptList
from backend.auth import get_current_user
from backend.firebase import firebase_manager
import logging
from typing import Dict, Any
import time

# Настройка логирования
logger = logging.getLogger('prompts_router')

# Кэш для ответов
response_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5 минут в секундах

router = APIRouter(
    tags=["prompts"]
)

@router.get("/prompts", response_model=PromptList)
async def get_prompts(response: Response, user_id: str = Depends(get_current_user)):
    """
    Get all prompts for the current user.
    """
    # Проверка кэша
    cache_key = f"prompts_list_{user_id}"
    current_time = time.time()
    
    if cache_key in response_cache:
        cache_data = response_cache[cache_key]
        if current_time - cache_data["timestamp"] < CACHE_TTL:
            # Устанавливаем заголовок для кэширования на стороне клиента
            response.headers["X-Cache"] = "HIT"
            return cache_data["data"]
    
    # Получение данных из Firebase
    prompts_data = firebase_manager.get_user_prompts(user_id)
    result = PromptList(prompts=prompts_data)
    
    # Сохранение в кэше
    response_cache[cache_key] = {
        "data": result,
        "timestamp": current_time
    }
    
    # Устанавливаем заголовок для кэширования на стороне клиента
    response.headers["Cache-Control"] = "private, max-age=300"
    response.headers["X-Cache"] = "MISS"
    
    return result

@router.get("/prompts/{prompt_id}", response_model=Prompt)
async def get_prompt(prompt_id: str, response: Response, user_id: str = Depends(get_current_user)):
    """
    Get a specific prompt by ID.
    """
    # Проверка кэша
    cache_key = f"prompt_{prompt_id}_{user_id}"
    current_time = time.time()
    
    if cache_key in response_cache:
        cache_data = response_cache[cache_key]
        if current_time - cache_data["timestamp"] < CACHE_TTL:
            response.headers["X-Cache"] = "HIT"
            return cache_data["data"]
    
    # Получение данных из Firebase
    prompt_data = firebase_manager.get_prompt(prompt_id, user_id)
    if not prompt_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    result = Prompt(**prompt_data)
    
    # Сохранение в кэше
    response_cache[cache_key] = {
        "data": result,
        "timestamp": current_time
    }
    
    response.headers["Cache-Control"] = "private, max-age=300"
    response.headers["X-Cache"] = "MISS"
    
    return result

@router.post("/prompts", response_model=Prompt)
async def create_prompt(prompt: Prompt, user_id: str = Depends(get_current_user)):
    """
    Create a new prompt.
    """
    try:
        # Prepare prompt data for Firestore
        prompt_data = prompt.dict(exclude={"id", "userId", "createdAt", "updatedAt"})
        prompt_data["userId"] = user_id
        
        # Save to Firestore using FirebaseManager
        created_prompt = firebase_manager.create_prompt(prompt_data)
        
        if not created_prompt:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create prompt"
            )
        
        # Очистка кэша для списка промптов
        cache_key = f"prompts_list_{user_id}"
        if cache_key in response_cache:
            del response_cache[cache_key]
        
        return Prompt(**created_prompt)
    except Exception as e:
        logger.error(f"Error creating prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create prompt"
        )

@router.put("/prompts/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: str, prompt: Prompt, user_id: str = Depends(get_current_user)):
    """
    Update an existing prompt.
    """
    try:
        # Prepare prompt data for Firestore
        prompt_data = prompt.dict(exclude={"id", "userId", "createdAt", "updatedAt"})
        
        # Update in Firestore using FirebaseManager
        updated_prompt = firebase_manager.update_prompt(prompt_id, prompt_data, user_id)
        
        if not updated_prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found or you don't have permission to update it"
            )
        
        # Очистка кэша
        cache_key_list = f"prompts_list_{user_id}"
        cache_key_detail = f"prompt_{prompt_id}_{user_id}"
        
        if cache_key_list in response_cache:
            del response_cache[cache_key_list]
        
        if cache_key_detail in response_cache:
            del response_cache[cache_key_detail]
        
        return Prompt(**updated_prompt)
    except Exception as e:
        logger.error(f"Error updating prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prompt"
        )

@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a prompt.
    """
    try:
        success = firebase_manager.delete_prompt(prompt_id, user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found or you don't have permission to delete it"
            )
        
        # Очистка кэша
        cache_key_list = f"prompts_list_{user_id}"
        cache_key_detail = f"prompt_{prompt_id}_{user_id}"
        
        if cache_key_list in response_cache:
            del response_cache[cache_key_list]
        
        if cache_key_detail in response_cache:
            del response_cache[cache_key_detail]
        
        return {"message": "Prompt deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prompt"
        )
