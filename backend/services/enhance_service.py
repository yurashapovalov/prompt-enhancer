import hashlib
import time
from typing import Dict, Any
import logging
from ..utils.caching import Cache, cached
from ..repositories.history_repository import HistoryRepository

# Logger for enhance service
logger = logging.getLogger("enhance_service")

# Cache for enhance results
enhance_cache = Cache[str]()

class EnhanceService:
    """
    Service for enhancing prompts
    """
    def __init__(self):
        self.history_repository = HistoryRepository()

    @cached(enhance_cache)
    async def enhance_prompt(self, text: str, user_id: str) -> str:
        """
        Enhance a prompt using AI techniques

        Args:
            text: Original prompt text
            user_id: User ID

        Returns:
            Enhanced prompt text
        """
        try:
            logger.info(f"Enhancing prompt for user {user_id}")

            # For MVP we'll just add some enhancements to the prompt
            # In a real implementation this would use more sophisticated techniques

            original_text = text
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

            # Save to history
            await self.history_repository.add_entry(
                user_id=user_id,
                original_prompt=original_text,
                enhanced_prompt=enhanced_text
            )

            logger.info(f"Prompt enhanced successfully for user {user_id}")
            return enhanced_text

        except Exception as e:
            logger.error(f"Error enhancing prompt: {str(e)}")
            # In case of error, return the original text
            return text

# Create singleton instance
enhance_service = EnhanceService()
