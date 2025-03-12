from typing import List, Optional, Dict, Any
import logging
from ..models.history import HistoryEntry
from ..repositories.history_repository import HistoryRepository

# Logger for history service
logger = logging.getLogger("history_service")

class HistoryService:
    """
    Service for history operations
    """
    def __init__(self):
        self.repository = HistoryRepository()
    
    async def get_history(self, user_id: str, limit: int = 20, offset: int = 0) -> List[HistoryEntry]:
        """
        Get history entries for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of entries to return
            offset: Number of entries to skip
        
        Returns:
            List of history entries
        """
        try:
            logger.info(f"Getting history for user {user_id}")
            entries = await self.repository.get_all(user_id, limit, offset)
            logger.info(f"Retrieved {len(entries)} history entries for user {user_id}")
            return entries
        
        except Exception as e:
            logger.error(f"Error getting history: {str(e)}")
            raise
    
    async def get_recent_history(self, user_id: str, limit: int = 10) -> List[HistoryEntry]:
        """
        Get recent history entries for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of entries to return
        
        Returns:
            List of recent history entries
        """
        try:
            logger.info(f"Getting recent history for user {user_id}")
            entries = await self.repository.get_recent(user_id, limit)
            logger.info(f"Retrieved {len(entries)} recent history entries for user {user_id}")
            return entries
        
        except Exception as e:
            logger.error(f"Error getting recent history: {str(e)}")
            raise
    
    async def get_history_entry(self, user_id: str, entry_id: str) -> Optional[HistoryEntry]:
        """
        Get a history entry by ID
        
        Args:
            user_id: User ID
            entry_id: History entry ID
        
        Returns:
            History entry or None if not found
        """
        try:
            logger.info(f"Getting history entry {entry_id} for user {user_id}")
            entry = await self.repository.get_by_id(user_id, entry_id)
            
            if entry:
                logger.info(f"Retrieved history entry {entry_id} for user {user_id}")
            else:
                logger.info(f"History entry {entry_id} not found for user {user_id}")
            
            return entry
        
        except Exception as e:
            logger.error(f"Error getting history entry {entry_id}: {str(e)}")
            raise
    
    async def add_history_entry(self, user_id: str, original_prompt: str, enhanced_prompt: str) -> HistoryEntry:
        """
        Add a new history entry
        
        Args:
            user_id: User ID
            original_prompt: Original prompt text
            enhanced_prompt: Enhanced prompt text
        
        Returns:
            Created history entry
        """
        try:
            logger.info(f"Adding history entry for user {user_id}")
            
            # Add entry to repository
            entry = await self.repository.add_entry(user_id, original_prompt, enhanced_prompt)
            
            logger.info(f"Added history entry {entry.id} for user {user_id}")
            return entry
        
        except Exception as e:
            logger.error(f"Error adding history entry: {str(e)}")
            raise
    
    async def delete_history_entry(self, user_id: str, entry_id: str) -> None:
        """
        Delete a history entry
        
        Args:
            user_id: User ID
            entry_id: History entry ID
        """
        try:
            logger.info(f"Deleting history entry {entry_id} for user {user_id}")
            
            # Check if entry exists
            existing_entry = await self.repository.get_by_id(user_id, entry_id)
            if not existing_entry:
                logger.error(f"History entry {entry_id} not found for user {user_id}")
                raise ValueError(f"History entry {entry_id} not found")
            
            # Delete from repository
            await self.repository.delete(user_id, entry_id)
            
            logger.info(f"Deleted history entry {entry_id} for user {user_id}")
        
        except Exception as e:
            logger.error(f"Error deleting history entry {entry_id}: {str(e)}")
            raise
    
    async def clear_history(self, user_id: str) -> None:
        """
        Clear all history entries for a user
        
        Args:
            user_id: User ID
        """
        try:
            logger.info(f"Clearing history for user {user_id}")
            
            # Delete all entries from repository
            await self.repository.delete_all(user_id)
            
            logger.info(f"Cleared history for user {user_id}")
        
        except Exception as e:
            logger.error(f"Error clearing history: {str(e)}")
            raise
    
    async def search_history(self, user_id: str, query: str) -> List[HistoryEntry]:
        """
        Search history entries by text
        
        Args:
            user_id: User ID
            query: Search query
        
        Returns:
            List of matching history entries
        """
        try:
            logger.info(f"Searching history for user {user_id} with query '{query}'")
            
            # Search in repository
            results = await self.repository.search_by_text(user_id, query)
            
            logger.info(f"Found {len(results)} history entries matching '{query}' for user {user_id}")
            return results
        
        except Exception as e:
            logger.error(f"Error searching history with query '{query}': {str(e)}")
            raise

# Create singleton instance
history_service = HistoryService()
