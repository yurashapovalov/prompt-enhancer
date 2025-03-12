from typing import List, Optional
from ..models.prompt import Prompt
from .base import BaseRepository
import logging

# Logger for prompt repository operations
logger = logging.getLogger("prompt_repository")

class PromptRepository(BaseRepository[Prompt]):
    """
    Repository for prompt operations
    """
    def __init__(self):
        super().__init__("prompts", Prompt)
    
    async def get_by_name(self, user_id: str, name: str) -> Optional[Prompt]:
        """
        Get prompt by name
        
        Args:
            user_id: User ID
            name: Prompt name
        
        Returns:
            Prompt instance or None if not found
        """
        try:
            collection_ref = self._get_collection_ref(user_id)
            
            # Query by name
            query = collection_ref.where("prompt_name", "==", name).limit(1)
            docs = query.stream()
            
            # Get first document
            for doc in docs:
                logger.debug(f"Retrieved prompt with name '{name}' for user {user_id}")
                return self._document_to_model(doc)
            
            logger.debug(f"Prompt with name '{name}' not found for user {user_id}")
            return None
        
        except Exception as e:
            logger.error(f"Error getting prompt by name '{name}': {str(e)}")
            raise
    
    async def search(self, user_id: str, query: str, limit: int = 10) -> List[Prompt]:
        """
        Search prompts by name or description
        
        Args:
            user_id: User ID
            query: Search query
            limit: Maximum number of results
        
        Returns:
            List of matching prompts
        """
        try:
            # Note: Firestore doesn't support full-text search
            # This is a simple implementation that checks if the query is contained in the name or description
            # For a real application, consider using a dedicated search service like Algolia or Elasticsearch
            
            collection_ref = self._get_collection_ref(user_id)
            docs = collection_ref.stream()
            
            results = []
            query = query.lower()
            
            for doc in docs:
                data = doc.to_dict()
                
                # Check if query is in name or description
                if (
                    query in data.get("prompt_name", "").lower() or 
                    query in data.get("prompt_description", "").lower()
                ):
                    results.append(self._document_to_model(doc))
                    
                    # Stop if we have enough results
                    if len(results) >= limit:
                        break
            
            logger.debug(f"Found {len(results)} prompts matching '{query}' for user {user_id}")
            return results
        
        except Exception as e:
            logger.error(f"Error searching prompts with query '{query}': {str(e)}")
            raise
