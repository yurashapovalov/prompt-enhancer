from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import Firebase manager
from backend.firebase_config import firebase_manager

# Import routers
from backend.routers import root, enhance, templates, prompts, variables, history

# Initialize FastAPI app
app = FastAPI(title="Prompt Enhancer API")

# Add CORS middleware to allow requests from the extension and web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(root.router)
app.include_router(enhance.router)
app.include_router(templates.router)
app.include_router(prompts.router)
app.include_router(variables.router)
app.include_router(history.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
