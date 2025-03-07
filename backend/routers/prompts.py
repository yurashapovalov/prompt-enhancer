from fastapi import APIRouter, Depends, HTTPException, status
from backend.models import Prompt, PromptList
from backend.auth import get_current_user
from backend.firebase import firebase_manager

router = APIRouter(
    prefix="/api",
    tags=["prompts"]
)

@router.get("/prompts", response_model=PromptList)
async def get_prompts(user_id: str = Depends(get_current_user)):
    """
    Get all prompts for the current user.
    """
    prompts_data = firebase_manager.get_user_prompts(user_id)
    return PromptList(prompts=prompts_data)

@router.get("/prompts/{prompt_id}", response_model=Prompt)
async def get_prompt(prompt_id: str, user_id: str = Depends(get_current_user)):
    """
    Get a specific prompt by ID.
    """
    prompt_data = firebase_manager.get_prompt(prompt_id, user_id)
    if not prompt_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    return Prompt(**prompt_data)

@router.post("/prompts", response_model=Prompt)
async def create_prompt(prompt: Prompt, user_id: str = Depends(get_current_user)):
    """
    Create a new prompt.
    """
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
    
    return Prompt(**created_prompt)

@router.put("/prompts/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: str, prompt: Prompt, user_id: str = Depends(get_current_user)):
    """
    Update an existing prompt.
    """
    # Prepare prompt data for Firestore
    prompt_data = prompt.dict(exclude={"id", "userId", "createdAt", "updatedAt"})
    
    # Update in Firestore using FirebaseManager
    updated_prompt = firebase_manager.update_prompt(prompt_id, prompt_data, user_id)
    
    if not updated_prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found or you don't have permission to update it"
        )
    
    return Prompt(**updated_prompt)

@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a prompt.
    """
    success = firebase_manager.delete_prompt(prompt_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found or you don't have permission to delete it"
        )
    
    return {"message": "Prompt deleted successfully"}
