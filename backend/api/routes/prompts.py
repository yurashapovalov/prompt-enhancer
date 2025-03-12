from fastapi import APIRouter, HTTPException, status, Query, Path, Body
from typing import List, Dict, Any, Optional
import logging
from ...models.prompt import Prompt
from ...core.exceptions import NotFoundException
from ..deps import CurrentUser, PromptService

# Logger for prompts routes
logger = logging.getLogger("routes.prompts")

# Create router
router = APIRouter(
    prefix="/prompts",
    tags=["prompts"],
    responses={
        404: {"description": "Not found"},
        401: {"description": "Unauthorized"},
    },
)

@router.get("", response_model=Dict[str, List[Prompt]])
async def get_prompts(
    user_id: CurrentUser,
    prompt_service: PromptService,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> Dict[str, List[Prompt]]:
    """
    Get all prompts for the current user
    
    Args:
        user_id: Current user ID
        prompt_service: Prompt service
        limit: Maximum number of prompts to return
        offset: Number of prompts to skip
    
    Returns:
        List of prompts
    """
    try:
        logger.info(f"Getting prompts for user {user_id}")
        
        # Get prompts from service
        prompts = await prompt_service.get_all_prompts(user_id, limit, offset)
        
        return {"prompts": prompts}
    
    except Exception as e:
        logger.error(f"Error getting prompts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting prompts: {str(e)}",
        )

@router.get("/{prompt_id}", response_model=Prompt)
async def get_prompt(
    prompt_id: str = Path(..., title="Prompt ID"),
    user_id: CurrentUser = None,
    prompt_service: PromptService = None,
) -> Prompt:
    """
    Get a prompt by ID
    
    Args:
        prompt_id: Prompt ID
        user_id: Current user ID
        prompt_service: Prompt service
    
    Returns:
        Prompt
    """
    try:
        logger.info(f"Getting prompt {prompt_id} for user {user_id}")
        
        # Get prompt from service
        prompt = await prompt_service.get_prompt(user_id, prompt_id)
        
        if not prompt:
            logger.error(f"Prompt {prompt_id} not found for user {user_id}")
            raise NotFoundException(f"Prompt with ID {prompt_id} not found")
        
        return prompt
    
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    except Exception as e:
        logger.error(f"Error getting prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting prompt: {str(e)}",
        )

@router.post("", response_model=Prompt)
async def create_prompt(
    prompt_data: Dict[str, Any] = Body(...),
    user_id: CurrentUser = None,
    prompt_service: PromptService = None,
) -> Prompt:
    """
    Create a new prompt
    
    Args:
        prompt_data: Prompt data
        user_id: Current user ID
        prompt_service: Prompt service
    
    Returns:
        Created prompt
    """
    try:
        logger.info(f"Creating prompt for user {user_id}")
        
        # Create prompt
        prompt = await prompt_service.create_prompt(user_id, prompt_data)
        
        return prompt
    
    except Exception as e:
        logger.error(f"Error creating prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating prompt: {str(e)}",
        )

@router.put("/{prompt_id}", response_model=Prompt)
async def update_prompt(
    prompt_data: Dict[str, Any] = Body(...),
    prompt_id: str = Path(..., title="Prompt ID"),
    user_id: CurrentUser = None,
    prompt_service: PromptService = None,
) -> Prompt:
    """
    Update a prompt
    
    Args:
        prompt_data: Prompt data
        prompt_id: Prompt ID
        user_id: Current user ID
        prompt_service: Prompt service
    
    Returns:
        Updated prompt
    """
    try:
        logger.info(f"Updating prompt {prompt_id} for user {user_id}")
        
        # Update prompt
        prompt = await prompt_service.update_prompt(user_id, prompt_id, prompt_data)
        
        return prompt
    
    except ValueError as e:
        logger.error(f"Prompt {prompt_id} not found for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    except Exception as e:
        logger.error(f"Error updating prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating prompt: {str(e)}",
        )

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: str = Path(..., title="Prompt ID"),
    user_id: CurrentUser = None,
    prompt_service: PromptService = None,
) -> None:
    """
    Delete a prompt
    
    Args:
        prompt_id: Prompt ID
        user_id: Current user ID
        prompt_service: Prompt service
    """
    try:
        logger.info(f"Deleting prompt {prompt_id} for user {user_id}")
        
        # Delete prompt
        await prompt_service.delete_prompt(user_id, prompt_id)
    
    except ValueError as e:
        logger.error(f"Prompt {prompt_id} not found for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    except Exception as e:
        logger.error(f"Error deleting prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting prompt: {str(e)}",
        )

@router.get("/search/{query}", response_model=Dict[str, List[Prompt]])
async def search_prompts(
    query: str = Path(..., title="Search query"),
    user_id: CurrentUser = None,
    prompt_service: PromptService = None,
) -> Dict[str, List[Prompt]]:
    """
    Search prompts by name or description
    
    Args:
        query: Search query
        user_id: Current user ID
        prompt_service: Prompt service
    
    Returns:
        List of matching prompts
    """
    try:
        logger.info(f"Searching prompts for user {user_id} with query '{query}'")
        
        # Search prompts
        prompts = await prompt_service.search_prompts(user_id, query)
        
        return {"prompts": prompts}
    
    except Exception as e:
        logger.error(f"Error searching prompts with query '{query}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching prompts: {str(e)}",
        )
