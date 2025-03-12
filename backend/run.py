#!/usr/bin/env python3
"""
Script to run the backend application
"""
import uvicorn
import os
import sys
import logging

# Добавляем родительскую директорию в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.config.settings import settings
from backend.utils.logging import initialize_logging

# Initialize logging
logger = initialize_logging()

def main():
    """
    Main function to run the application
    """
    try:
        logger.info("Starting backend application")
        
        # Get host and port from environment variables or settings
        host = os.environ.get("HOST", settings.HOST)
        port = int(os.environ.get("PORT", settings.PORT))
        
        # Run application
        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=settings.DEBUG,
            log_level=settings.LOG_LEVEL.lower(),
            workers=os.cpu_count()
        )
    
    except Exception as e:
        logger.error(f"Error starting application: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
