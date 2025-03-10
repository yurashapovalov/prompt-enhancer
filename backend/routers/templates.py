from fastapi import APIRouter, Depends, HTTPException, status
from backend.models import PromptTemplate, PromptTemplateList
from backend.auth import get_current_user
from datetime import datetime
from backend.firebase import firebase_manager

router = APIRouter(
    tags=["templates"]
)

@router.get("/prompt-templates", response_model=PromptTemplateList)
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

@router.post("/prompt-templates", response_model=PromptTemplate)
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
