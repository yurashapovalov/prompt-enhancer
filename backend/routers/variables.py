from fastapi import APIRouter, Depends, HTTPException, status
from backend.models import Variable, VariableList
from backend.auth import get_current_user
from backend.firebase import firebase_manager

router = APIRouter(
    prefix="/api",
    tags=["variables"]
)

@router.get("/variables", response_model=VariableList)
async def get_variables(user_id: str = Depends(get_current_user)):
    """
    Get all variables for the current user.
    """
    variables_data = firebase_manager.get_user_variables(user_id)
    return VariableList(variables=variables_data)

@router.get("/variables/{variable_id}", response_model=Variable)
async def get_variable(variable_id: str, user_id: str = Depends(get_current_user)):
    """
    Get a specific variable by ID.
    """
    variable_data = firebase_manager.get_variable(variable_id, user_id)
    if not variable_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variable not found"
        )
    return Variable(**variable_data)

@router.post("/variables", response_model=Variable)
async def create_variable(variable: Variable, user_id: str = Depends(get_current_user)):
    """
    Create a new variable.
    """
    # Prepare variable data for Firestore
    variable_data = variable.dict(exclude={"id", "userId", "createdAt", "updatedAt"})
    variable_data["userId"] = user_id
    
    # Save to Firestore using FirebaseManager
    created_variable = firebase_manager.create_variable(variable_data)
    
    if not created_variable:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create variable"
        )
    
    return Variable(**created_variable)

@router.put("/variables/{variable_id}", response_model=Variable)
async def update_variable(variable_id: str, variable: Variable, user_id: str = Depends(get_current_user)):
    """
    Update an existing variable.
    """
    # Prepare variable data for Firestore
    variable_data = variable.dict(exclude={"id", "userId", "createdAt", "updatedAt"})
    
    # Update in Firestore using FirebaseManager
    updated_variable = firebase_manager.update_variable(variable_id, variable_data, user_id)
    
    if not updated_variable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variable not found or you don't have permission to update it"
        )
    
    return Variable(**updated_variable)

@router.delete("/variables/{variable_id}")
async def delete_variable(variable_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a variable.
    """
    success = firebase_manager.delete_variable(variable_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variable not found or you don't have permission to delete it"
        )
    
    return {"message": "Variable deleted successfully"}
