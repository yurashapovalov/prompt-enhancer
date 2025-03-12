from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List
import os

class Settings(BaseSettings):
    """
    Application settings
    """
    # App info
    APP_NAME: str = "Prompt Enhancer API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API для улучшения промптов и управления переменными"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Firebase settings
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # Cache settings
    CACHE_TTL: int = 3600  # 1 hour in seconds
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "server_log.txt"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
