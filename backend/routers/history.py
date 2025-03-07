from fastapi import APIRouter, Depends, HTTPException, status
from backend.models import HistoryEntry, HistoryList
from backend.auth import get_current_user
from backend.firebase import firebase_manager

router = APIRouter(
    prefix="/api",
    tags=["history"]
)

@router.get("/history", response_model=HistoryList)
async def get_history(limit: int = 20, offset: int = 0, user_id: str = Depends(get_current_user)):
    """
    Get history entries for the current user.
    """
    history_data = firebase_manager.get_user_history(user_id, limit, offset)
    return HistoryList(history=history_data)

@router.post("/history", response_model=HistoryEntry)
async def add_history_entry(entry: HistoryEntry, user_id: str = Depends(get_current_user)):
    """
    Add a new history entry.
    """
    # Prepare history data for Firestore
    entry_data = entry.dict(exclude={"id", "userId", "timestamp"})
    entry_data["userId"] = user_id
    
    # Save to Firestore using FirebaseManager
    created_entry = firebase_manager.add_history_entry(entry_data)
    
    if not created_entry:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add history entry"
        )
    
    return HistoryEntry(**created_entry)

@router.delete("/history/{entry_id}")
async def delete_history_entry(entry_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a history entry.
    """
    success = firebase_manager.delete_history_entry(entry_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History entry not found or you don't have permission to delete it"
        )
    
    return {"message": "History entry deleted successfully"}

@router.delete("/history")
async def clear_history(user_id: str = Depends(get_current_user)):
    """
    Clear all history entries for the current user.
    """
    success = firebase_manager.clear_user_history(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear history"
        )
    
    return {"message": "History cleared successfully"}
