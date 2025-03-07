from typing import List, Dict, Any, Optional
import logging

from .base import BaseRepository

# Logging setup
logger = logging.getLogger(__name__)

class VariablesRepository(BaseRepository):
    """
    Repository for variables operations.
    """
    def __init__(self):
        """
        Initialize the repository with the 'variables' collection.
        """
        super().__init__("variables")
    
    def get_user_variables(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all variables for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of variables.
        """
        return self.get_all_for_user(user_id)
    
    def get_variable(self, variable_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific variable.
        
        Args:
            variable_id: The variable ID.
            user_id: The user ID.
            
        Returns:
            The variable data, or None if not found.
        """
        return self.get_by_id(variable_id, user_id)
    
    def create_variable(self, variable_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new variable.
        
        Args:
            variable_data: The variable data.
            
        Returns:
            The created variable with ID, or None if creation failed.
        """
        return self.create(variable_data)
    
    def update_variable(self, variable_id: str, variable_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """
        Update an existing variable.
        
        Args:
            variable_id: The variable ID.
            variable_data: The variable data to update.
            user_id: The user ID.
            
        Returns:
            The updated variable, or None if update failed.
        """
        return self.update(variable_id, variable_data, user_id)
    
    def delete_variable(self, variable_id: str, user_id: str) -> bool:
        """
        Delete a variable.
        
        Args:
            variable_id: The variable ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        return self.delete(variable_id, user_id)

# Create a singleton instance
variables_repository = VariablesRepository()
