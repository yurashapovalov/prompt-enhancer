from fastapi import Depends
from typing import Annotated
from ..core.auth import get_current_user, get_optional_user
from ..services.prompt_service import prompt_service
from ..services.history_service import history_service
from ..services.enhance_service import enhance_service

# Authentication dependencies
CurrentUser = Annotated[str, Depends(get_current_user)]
OptionalUser = Annotated[str, Depends(get_optional_user)]

# Service dependencies
def get_prompt_service():
    """
    Dependency for prompt service
    """
    return prompt_service

def get_history_service():
    """
    Dependency for history service
    """
    return history_service

def get_enhance_service():
    """
    Dependency for enhance service
    """
    return enhance_service

# Annotated dependencies for services
PromptService = Annotated[prompt_service.__class__, Depends(get_prompt_service)]
HistoryService = Annotated[history_service.__class__, Depends(get_history_service)]
EnhanceService = Annotated[enhance_service.__class__, Depends(get_enhance_service)]
