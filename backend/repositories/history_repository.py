from typing import List, Optional
from datetime import datetime
from firebase_admin import firestore
from ..models.history import HistoryEntry
from .base import BaseRepository
import logging

# Logger for history repository operations
logger = logging.getLogger("history_repository")

class HistoryRepository(BaseRepository[HistoryEntry]):
    """
    Repository for history operations
    """
    def __init__(self):
        super().__init__("history", HistoryEntry)
    
    async def get_recent(self, user_id: str, limit: int = 10) -> List[HistoryEntry]:
        """
        Get recent history entries
        
        Args:
            user_id: User ID
            limit: Maximum number of entries to return
        
        Returns:
            List of recent history entries
        """
        try:
            collection_ref = self._get_collection_ref(user_id)
            
            # Query by timestamp in descending order
            query = collection_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            
            # Convert documents to models
            result = [self._document_to_model(doc) for doc in docs]
            
            logger.debug(f"Retrieved {len(result)} recent history entries for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error getting recent history entries: {str(e)}")
            raise
    
    async def add_entry(self, user_id: str, original_prompt: str, enhanced_prompt: str) -> HistoryEntry:
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
            # Create history entry
            entry = HistoryEntry(
                original_prompt=original_prompt,
                enhanced_prompt=enhanced_prompt,
                timestamp=datetime.now(),
                user_id=user_id
            )
            
            # Save to database
            result = await self.create(user_id, entry)
            
            logger.debug(f"Added history entry for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error adding history entry: {str(e)}")
            raise
    
    async def search_by_text(self, user_id: str, query: str, limit: int = 10) -> List[HistoryEntry]:
        """
        Search history entries by text
        
        Args:
            user_id: User ID
            query: Search query
            limit: Maximum number of results
        
        Returns:
            List of matching history entries
        """
        try:
            # Note: Firestore doesn't support full-text search
            # This is a simple implementation that checks if the query is contained in the original or enhanced prompt
            
            collection_ref = self._get_collection_ref(user_id)
            docs = collection_ref.stream()
            
            results = []
            query = query.lower()
            
            for doc in docs:
                data = doc.to_dict()
                
                # Check if query is in original or enhanced prompt
                if (
                    query in data.get("original_prompt", "").lower() or 
                    query in data.get("enhanced_prompt", "").lower()
                ):
                    results.append(self._document_to_model(doc))
                    
                    # Stop if we have enough results
                    if len(results) >= limit:
                        break
            
            logger.debug(f"Found {len(results)} history entries matching '{query}' for user {user_id}")
            return results
        
        except Exception as e:
            logger.error(f"Error searching history entries with query '{query}': {str(e)}")
            raise
