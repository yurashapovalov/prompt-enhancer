from fastapi import APIRouter, Depends
from backend.models import PromptRequest, PromptResponse
from backend.auth import get_current_user

router = APIRouter(
    prefix="/api",
    tags=["enhance"]
)

@router.post("/enhance-prompt", response_model=PromptResponse)
async def enhance_prompt(
    prompt: PromptRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Enhance a prompt using AI techniques.
    """
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
    
    return PromptResponse(enhancedText=enhanced_text)
