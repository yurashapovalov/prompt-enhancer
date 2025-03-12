from fastapi import APIRouter, Response, Depends
from typing import Dict, Any
import logging
from ...models.prompt import PromptRequest, PromptResponse
from ..deps import CurrentUser, EnhanceService

# Logger for enhance routes
logger = logging.getLogger("routes.enhance")

# Create router
router = APIRouter(
    prefix="/enhance",
    tags=["enhance"],
    responses={
        404: {"description": "Not found"},
        401: {"description": "Unauthorized"},
    },
)

@router.post("", response_model=PromptResponse)
async def enhance_prompt(
    prompt: PromptRequest,
    response: Response,
    user_id: CurrentUser,
    enhance_service: EnhanceService,
) -> PromptResponse:
    """
    Enhance a prompt using AI techniques
    
    Args:
        prompt: Prompt request with text to enhance
        response: FastAPI response object
        user_id: Current user ID
        enhance_service: Enhance service
    
    Returns:
        Enhanced prompt response
    """
    try:
        logger.info(f"Enhancing prompt for user {user_id}")
        
        # Enhance prompt
        enhanced_text = await enhance_service.enhance_prompt(prompt.text, user_id)
        
        # Set cache headers
        response.headers["Cache-Control"] = "private, max-age=3600"
        
        # Return response
        return PromptResponse(enhancedText=enhanced_text)
    
    except Exception as e:
        logger.error(f"Error enhancing prompt: {str(e)}")
        # In case of error, return the original text
        return PromptResponse(enhancedText=prompt.text)
