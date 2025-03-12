from typing import List, Optional, Dict, Any
import logging
from ..models.prompt import Prompt, PromptVariable
from ..repositories.prompt_repository import PromptRepository

# Logger for prompt service
logger = logging.getLogger("prompt_service")

class PromptService:
    """
    Service for prompt operations
    """
    def __init__(self):
        self.repository = PromptRepository()
    
    async def get_all_prompts(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Prompt]:
        """
        Get all prompts for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of prompts to return
            offset: Number of prompts to skip
        
        Returns:
            List of prompts
        """
        try:
            logger.info(f"Getting prompts for user {user_id}")
            prompts = await self.repository.get_all(user_id, limit, offset)
            logger.info(f"Retrieved {len(prompts)} prompts for user {user_id}")
            return prompts
        
        except Exception as e:
            logger.error(f"Error getting prompts: {str(e)}")
            raise
    
    async def get_prompt(self, user_id: str, prompt_id: str) -> Optional[Prompt]:
        """
        Get a prompt by ID
        
        Args:
            user_id: User ID
            prompt_id: Prompt ID
        
        Returns:
            Prompt or None if not found
        """
        try:
            logger.info(f"Getting prompt {prompt_id} for user {user_id}")
            prompt = await self.repository.get_by_id(user_id, prompt_id)
            
            if prompt:
                logger.info(f"Retrieved prompt {prompt_id} for user {user_id}")
            else:
                logger.info(f"Prompt {prompt_id} not found for user {user_id}")
            
            return prompt
        
        except Exception as e:
            logger.error(f"Error getting prompt {prompt_id}: {str(e)}")
            raise
    
    async def create_prompt(self, user_id: str, prompt_data: Dict[str, Any]) -> Prompt:
        """
        Create a new prompt
        
        Args:
            user_id: User ID
            prompt_data: Prompt data
        
        Returns:
            Created prompt
        """
        try:
            logger.info(f"Creating prompt for user {user_id}")
            
            # Extract variables from prompt text
            variables = self._extract_variables(prompt_data.get("prompt_text", ""))
            
            # Create prompt model
            prompt = Prompt(
                prompt_name=prompt_data.get("prompt_name", ""),
                prompt_description=prompt_data.get("prompt_description", ""),
                prompt_text=prompt_data.get("prompt_text", ""),
                color=prompt_data.get("color", ""),
                variables=[PromptVariable(name=var, value="") for var in variables]
            )
            
            # Save to database
            result = await self.repository.create(user_id, prompt)
            
            logger.info(f"Created prompt {result.id} for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error creating prompt: {str(e)}")
            raise
    
    async def update_prompt(self, user_id: str, prompt_id: str, prompt_data: Dict[str, Any]) -> Prompt:
        """
        Update an existing prompt
        
        Args:
            user_id: User ID
            prompt_id: Prompt ID
            prompt_data: Prompt data
        
        Returns:
            Updated prompt
        """
        try:
            logger.info(f"Updating prompt {prompt_id} for user {user_id}")
            
            # Get existing prompt
            existing_prompt = await self.repository.get_by_id(user_id, prompt_id)
            if not existing_prompt:
                logger.error(f"Prompt {prompt_id} not found for user {user_id}")
                raise ValueError(f"Prompt {prompt_id} not found")
            
            # Extract variables from prompt text
            variables = self._extract_variables(prompt_data.get("prompt_text", ""))
            
            # Create updated prompt model
            updated_prompt = Prompt(
                id=prompt_id,
                prompt_name=prompt_data.get("prompt_name", existing_prompt.prompt_name),
                prompt_description=prompt_data.get("prompt_description", existing_prompt.prompt_description),
                prompt_text=prompt_data.get("prompt_text", existing_prompt.prompt_text),
                color=prompt_data.get("color", existing_prompt.color),
                variables=[PromptVariable(name=var, value="") for var in variables]
            )
            
            # Save to database
            result = await self.repository.update(user_id, prompt_id, updated_prompt)
            
            logger.info(f"Updated prompt {prompt_id} for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error updating prompt {prompt_id}: {str(e)}")
            raise
    
    async def delete_prompt(self, user_id: str, prompt_id: str) -> None:
        """
        Delete a prompt
        
        Args:
            user_id: User ID
            prompt_id: Prompt ID
        """
        try:
            logger.info(f"Deleting prompt {prompt_id} for user {user_id}")
            
            # Check if prompt exists
            existing_prompt = await self.repository.get_by_id(user_id, prompt_id)
            if not existing_prompt:
                logger.error(f"Prompt {prompt_id} not found for user {user_id}")
                raise ValueError(f"Prompt {prompt_id} not found")
            
            # Delete from database
            await self.repository.delete(user_id, prompt_id)
            
            logger.info(f"Deleted prompt {prompt_id} for user {user_id}")
        
        except Exception as e:
            logger.error(f"Error deleting prompt {prompt_id}: {str(e)}")
            raise
    
    async def search_prompts(self, user_id: str, query: str) -> List[Prompt]:
        """
        Search prompts by name or description
        
        Args:
            user_id: User ID
            query: Search query
        
        Returns:
            List of matching prompts
        """
        try:
            logger.info(f"Searching prompts for user {user_id} with query '{query}'")
            
            # Search in repository
            results = await self.repository.search(user_id, query)
            
            logger.info(f"Found {len(results)} prompts matching '{query}' for user {user_id}")
            return results
        
        except Exception as e:
            logger.error(f"Error searching prompts with query '{query}': {str(e)}")
            raise
    
    def _extract_variables(self, text: str) -> List[str]:
        """
        Extract variables from prompt text
        
        Args:
            text: Prompt text
        
        Returns:
            List of variable names
        """
        import re
        
        # Find all occurrences of {{variable_name}}
        matches = re.findall(r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}', text)
        
        # Remove duplicates
        variables = list(set(matches))
        
        logger.debug(f"Extracted variables from prompt text: {variables}")
        return variables

# Create singleton instance
prompt_service = PromptService()
