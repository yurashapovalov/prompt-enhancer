import logging
from functools import wraps
import time
from typing import Callable, Awaitable, TypeVar, Any, Optional
import os
from ..config.settings import settings

T = TypeVar('T')

def setup_logger(name: str, log_file: Optional[str] = None, level=None):
    """
    Set up a logger with the specified name, file, and level
    
    Args:
        name: Logger name
        log_file: Path to log file (if None, settings.LOG_FILE will be used)
        level: Logging level (if None, settings.LOG_LEVEL will be used)
    
    Returns:
        Configured logger instance
    """
    # Get level from settings if not provided
    if level is None:
        level_name = settings.LOG_LEVEL
        level = getattr(logging, level_name)
    
    # Get log file from settings if not provided
    if log_file is None:
        log_file = settings.LOG_FILE
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Add console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Add file handler if log file is specified
    if log_file:
        # Ensure directory exists
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

def log_execution_time(logger: logging.Logger, threshold: float = 0.5):
    """
    Decorator to log function execution time if it exceeds threshold
    
    Args:
        logger: Logger to use
        threshold: Time threshold in seconds
    """
    def decorator(func: Callable[..., Awaitable[T]]):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log only if execution time exceeds threshold
            if execution_time > threshold:
                logger.warning(
                    f"Slow execution: {func.__name__} took {execution_time:.2f}s"
                )
            
            return result
        return wrapper
    return decorator

# Initialize root logger
def initialize_logging():
    """
    Initialize logging for the application
    """
    # Configure root logger
    root_logger = setup_logger("root", settings.LOG_FILE)
    
    # Set level for other loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    return root_logger
