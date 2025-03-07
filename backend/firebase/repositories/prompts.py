from typing import List, Dict, Any, Optional
import logging

from .base import BaseRepository

# Logging setup
logger = logging.getLogger(__name__)

class PromptsRepository(BaseRepository):
    """
    Repository for prompts operations.
    """
    def __init__(self):
        """
        Initialize the repository with the 'prompts' collection.
        """
        super().__init__("prompts")
    
    def get_user_prompts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all prompts for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of prompts.
        """
        return self.get_all_for_user(user_id)
    
    def get_prompt(self, prompt_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific prompt.
        
        Args:
            prompt_id: The prompt ID.
            user_id: The user ID.
            
        Returns:
            The prompt data, or None if not found.
        """
        return self.get_by_id(prompt_id, user_id)
    
    def create_prompt(self, prompt_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new prompt.
        
        Args:
            prompt_data: The prompt data.
            
        Returns:
            The created prompt with ID, or None if creation failed.
        """
        return self.create(prompt_data)
    
    def update_prompt(self, prompt_id: str, prompt_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """
        Update an existing prompt.
        
        Args:
            prompt_id: The prompt ID.
            prompt_data: The prompt data to update.
            user_id: The user ID.
            
        Returns:
            The updated prompt, or None if update failed.
        """
        return self.update(prompt_id, prompt_data, user_id)
    
    def delete_prompt(self, prompt_id: str, user_id: str) -> bool:
        """
        Delete a prompt.
        
        Args:
            prompt_id: The prompt ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        return self.delete(prompt_id, user_id)

# Create a singleton instance
prompts_repository = PromptsRepository()
