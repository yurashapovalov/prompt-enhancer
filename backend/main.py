from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

# Import Firebase manager
from firebase_config import firebase_manager

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

# Models
class PromptRequest(BaseModel):
    text: str

class PromptResponse(BaseModel):
    enhancedText: str

class PromptTemplate(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    category: str
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class PromptTemplateList(BaseModel):
    templates: List[PromptTemplate]

# Authentication dependency
async def get_current_user(authorization: str = Depends(lambda: None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify the Firebase token using FirebaseManager
        decoded_token = firebase_manager.verify_token(token)
        uid = decoded_token["uid"]
        return uid
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Prompt Enhancer API"}

@app.post("/api/enhance-prompt", response_model=PromptResponse)
async def enhance_prompt(
    prompt: PromptRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Enhance a prompt using AI techniques.
    """
    # For MVP, we'll just add some enhancements to the prompt
    # In a real implementation, this would use more sophisticated techniques
    
    original_text = prompt.text
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
    
    return PromptResponse(enhancedText=enhanced_text)

@app.get("/api/prompt-templates", response_model=PromptTemplateList)
async def get_prompt_templates(user_id: str = Depends(get_current_user)):
    """
    Get all prompt templates for the current user.
    """
    # Get templates from Firestore using FirebaseManager
    templates_data = firebase_manager.get_user_prompt_templates(user_id)
    
    # Convert to PromptTemplate objects
    templates = []
    for template_data in templates_data:
        # Convert timestamps if needed
        created_at = template_data.get("createdAt", datetime.now())
        updated_at = template_data.get("updatedAt", datetime.now())
        
        template = PromptTemplate(
            id=template_data.get("id"),
            title=template_data.get("title"),
            content=template_data.get("content"),
            category=template_data.get("category"),
            userId=user_id,
            createdAt=created_at,
            updatedAt=updated_at,
        )
        templates.append(template)
    
    return PromptTemplateList(templates=templates)

@app.post("/api/prompt-templates", response_model=PromptTemplate)
async def create_prompt_template(
    template: PromptTemplate,
    user_id: str = Depends(get_current_user)
):
    """
    Create a new prompt template.
    """
    # Prepare template data for Firestore
    template_data = {
        "title": template.title,
        "content": template.content,
        "category": template.category,
        "userId": user_id,
    }
    
    # Save to Firestore using FirebaseManager
    created_template = firebase_manager.create_prompt_template(template_data)
    
    if not created_template:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create prompt template"
        )
    
    # Convert to PromptTemplate object
    return PromptTemplate(
        id=created_template.get("id"),
        title=created_template.get("title"),
        content=created_template.get("content"),
        category=created_template.get("category"),
        userId=user_id,
        createdAt=created_template.get("createdAt", datetime.now()),
        updatedAt=created_template.get("updatedAt", datetime.now()),
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
