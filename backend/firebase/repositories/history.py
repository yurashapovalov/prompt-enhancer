from typing import List, Dict, Any, Optional
import logging

from .base import BaseRepository

# Logging setup
logger = logging.getLogger(__name__)

class HistoryRepository(BaseRepository):
    """
    Repository for history operations.
    """
    def __init__(self):
        """
        Initialize the repository with the 'history' collection.
        """
        super().__init__("history")
    
    def get_user_history(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get history entries for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of history entries.
        """
        return self.get_all_for_user(user_id)
    
    def add_history_entry(self, entry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Add a new history entry.
        
        Args:
            entry_data: The history entry data.
            
        Returns:
            The created history entry with ID, or None if creation failed.
        """
        return self.create(entry_data)
    
    def delete_history_entry(self, entry_id: str, user_id: str) -> bool:
        """
        Delete a history entry.
        
        Args:
            entry_id: The history entry ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        return self.delete(entry_id, user_id)
    
    def clear_user_history(self, user_id: str) -> bool:
        """
        Clear all history entries for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            True if clearing was successful, False otherwise.
        """
        logger.info(f"Clearing all history entries for user ID: {user_id}")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, cannot clear history for user '{user_id}'")
            return False
        
        try:
            # Get all history entries for the user
            history_ref = self.get_collection().where("userId", "==", user_id)
            
            # Delete each entry
            for doc in history_ref.stream():
                doc.reference.delete()
                logger.info(f"Deleted history entry: {doc.id}")
            
            logger.info(f"All history entries cleared for user ID: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing history for user ID '{user_id}': {str(e)}")
            return False

# Create a singleton instance
history_repository = HistoryRepository()
