from typing import List, Optional
from datetime import datetime
from pydantic import Field
from .base import BaseDBModel

class PromptVariable(BaseDBModel):
    """
    Model for prompt variables
    """
    name: str
    value: str

class Prompt(BaseDBModel):
    """
    Model for prompts
    """
    prompt_name: str
    prompt_description: str
    prompt_text: str
    color: str
    variables: Optional[List[PromptVariable]] = []

class PromptRequest(BaseDBModel):
    """
    Request model for prompt enhancement
    """
    text: str

class PromptResponse(BaseDBModel):
    """
    Response model for prompt enhancement
    """
    enhancedText: str
