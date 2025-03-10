from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server_log.txt"),  # Исправлен путь к файлу логов
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("main")

# Import Firebase manager
from backend.firebase_config import firebase_manager

# Import routers
from backend.routers import root, enhance, templates, prompts, history

# Middleware для измерения времени выполнения запросов
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Логируем только медленные запросы (более 0.5 секунды)
        if process_time > 0.5:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        
        return response

# Initialize FastAPI app
app = FastAPI(
    title="Prompt Enhancer API",
    description="API для улучшения промптов и управления переменными",
    version="1.0.0",
    docs_url="/docs",  # Стандартный путь для документации
    redoc_url="/redoc",  # Стандартный путь для ReDoc
    openapi_url="/openapi.json"  # Стандартный путь для OpenAPI
)

# Add CORS middleware to allow requests from the extension and web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Добавляем middleware для измерения времени выполнения запросов
app.add_middleware(TimingMiddleware)

# Include routers
app.include_router(root.router)
app.include_router(enhance.router)
app.include_router(templates.router)
app.include_router(prompts.router)
app.include_router(history.router)

# Событие запуска приложения
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup")

# Событие остановки приложения
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
