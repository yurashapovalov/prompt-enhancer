from fastapi import APIRouter, Depends, Response
from backend.models import PromptRequest, PromptResponse
from backend.auth import get_current_user
import logging
from typing import Dict, Any
import time
import hashlib

# Настройка логирования
logger = logging.getLogger('enhance_router')

# Кэш для ответов
response_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 3600  # 1 час в секундах (кэшируем дольше, т.к. результат не меняется)

router = APIRouter(
    tags=["enhance"]
)

@router.post("/enhance", response_model=PromptResponse)
async def enhance_prompt(
    prompt: PromptRequest,
    response: Response,
    user_id: str = Depends(get_current_user)
):
    """
    Enhance a prompt using AI techniques.
    """
    # Создаем хэш от текста промпта для использования в качестве ключа кэша
    text_hash = hashlib.md5(prompt.text.encode()).hexdigest()
    cache_key = f"enhance_{text_hash}"
    current_time = time.time()
    
    # Проверка кэша
    if cache_key in response_cache:
        cache_data = response_cache[cache_key]
        if current_time - cache_data["timestamp"] < CACHE_TTL:
            response.headers["X-Cache"] = "HIT"
            return cache_data["data"]
    
    try:
        # For MVP, we'll just add some enhancements to the prompt
        # In a real implementation, this would use more sophisticated techniques
        
        original_text = prompt.text
        enhanced_text = original_text
        
        # Simple enhancements
        if not enhanced_text.endswith((".", "!", "?")):
            enhanced_text += "."
        
        # Add specificity
        if "example" not in enhanced_text.lower():
            enhanced_text += " Please provide specific examples."
        
        # Add clarity request
        if "clear" not in enhanced_text.lower() and "concise" not in enhanced_text.lower():
            enhanced_text += " Make your response clear and concise."
        
        result = PromptResponse(enhancedText=enhanced_text)
        
        # Сохранение в кэше
        response_cache[cache_key] = {
            "data": result,
            "timestamp": current_time
        }
        
        response.headers["Cache-Control"] = "private, max-age=3600"
        response.headers["X-Cache"] = "MISS"
        
        return result
    except Exception as e:
        logger.error(f"Error enhancing prompt: {str(e)}")
        # В случае ошибки возвращаем оригинальный текст
        return PromptResponse(enhancedText=prompt.text)
