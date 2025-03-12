from datetime import datetime
from typing import Optional
from pydantic import Field
from .base import BaseDBModel

class HistoryEntry(BaseDBModel):
    """
    Model for history entries
    """
    original_prompt: str
    enhanced_prompt: str
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None

class HistoryRequest(BaseDBModel):
    """
    Request model for history operations
    """
    limit: Optional[int] = 20
    offset: Optional[int] = 0

class HistoryResponse(BaseDBModel):
    """
    Response model for history operations
    """
    history: list[HistoryEntry]
