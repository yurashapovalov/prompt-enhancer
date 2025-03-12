import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import logging

# Добавляем родительскую директорию в PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import configuration
from backend.config.settings import settings
from backend.config.firebase_config import initialize_firebase

# Import utilities
from backend.utils.logging import initialize_logging

# Import core components
from backend.core.middleware import TimingMiddleware
from backend.core.exceptions import setup_exception_handlers

# Import API routes
from backend.api.routes import root, enhance, prompts, history

# Initialize logging
logger = initialize_logging()

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        Configured FastAPI application
    """
    # Initialize FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add timing middleware
    app.add_middleware(TimingMiddleware)
    
    # Set up exception handlers
    setup_exception_handlers(app)
    
    # Include routers
    app.include_router(root.router)
    app.include_router(enhance.router)
    app.include_router(prompts.router)
    app.include_router(history.router)
    
    # Startup event
    @app.on_event("startup")
    async def startup_event():
        logger.info("Application startup")
        
        # Initialize Firebase
        initialize_firebase()
    
    # Shutdown event
    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Application shutdown")
    
    return app

# Create application instance
app = create_app()

if __name__ == "__main__":
    # Run application
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
