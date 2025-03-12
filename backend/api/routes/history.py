from fastapi import APIRouter, HTTPException, status, Query, Path
from typing import List, Dict, Any, Optional
import logging
from ...models.history import HistoryEntry, HistoryResponse
from ...core.exceptions import NotFoundException
from ..deps import CurrentUser, HistoryService

# Logger for history routes
logger = logging.getLogger("routes.history")

# Create router
router = APIRouter(
    prefix="/history",
    tags=["history"],
    responses={
        404: {"description": "Not found"},
        401: {"description": "Unauthorized"},
    },
)

@router.get("", response_model=HistoryResponse)
async def get_history(
    user_id: CurrentUser,
    history_service: HistoryService,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> HistoryResponse:
    """
    Get history entries for the current user
    
    Args:
        user_id: Current user ID
        history_service: History service
        limit: Maximum number of entries to return
        offset: Number of entries to skip
    
    Returns:
        List of history entries
    """
    try:
        logger.info(f"Getting history for user {user_id}")
        
        # Get history from service
        entries = await history_service.get_history(user_id, limit, offset)
        
        return HistoryResponse(history=entries)
    
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting history: {str(e)}",
        )

@router.get("/recent", response_model=HistoryResponse)
async def get_recent_history(
    user_id: CurrentUser,
    history_service: HistoryService,
    limit: int = Query(10, ge=1, le=50),
) -> HistoryResponse:
    """
    Get recent history entries for the current user
    
    Args:
        user_id: Current user ID
        history_service: History service
        limit: Maximum number of entries to return
    
    Returns:
        List of recent history entries
    """
    try:
        logger.info(f"Getting recent history for user {user_id}")
        
        # Get recent history from service
        entries = await history_service.get_recent_history(user_id, limit)
        
        return HistoryResponse(history=entries)
    
    except Exception as e:
        logger.error(f"Error getting recent history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recent history: {str(e)}",
        )

@router.get("/{entry_id}", response_model=HistoryEntry)
async def get_history_entry(
    entry_id: str = Path(..., title="History entry ID"),
    user_id: CurrentUser = None,
    history_service: HistoryService = None,
) -> HistoryEntry:
    """
    Get a history entry by ID
    
    Args:
        entry_id: History entry ID
        user_id: Current user ID
        history_service: History service
    
    Returns:
        History entry
    """
    try:
        logger.info(f"Getting history entry {entry_id} for user {user_id}")
        
        # Get history entry from service
        entry = await history_service.get_history_entry(user_id, entry_id)
        
        if not entry:
            logger.error(f"History entry {entry_id} not found for user {user_id}")
            raise NotFoundException(f"History entry with ID {entry_id} not found")
        
        return entry
    
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    except Exception as e:
        logger.error(f"Error getting history entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting history entry: {str(e)}",
        )

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_entry(
    entry_id: str = Path(..., title="History entry ID"),
    user_id: CurrentUser = None,
    history_service: HistoryService = None,
) -> None:
    """
    Delete a history entry
    
    Args:
        entry_id: History entry ID
        user_id: Current user ID
        history_service: History service
    """
    try:
        logger.info(f"Deleting history entry {entry_id} for user {user_id}")
        
        # Delete history entry
        await history_service.delete_history_entry(user_id, entry_id)
    
    except ValueError as e:
        logger.error(f"History entry {entry_id} not found for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    
    except Exception as e:
        logger.error(f"Error deleting history entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting history entry: {str(e)}",
        )

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    user_id: CurrentUser,
    history_service: HistoryService,
) -> None:
    """
    Clear all history entries for the current user
    
    Args:
        user_id: Current user ID
        history_service: History service
    """
    try:
        logger.info(f"Clearing history for user {user_id}")
        
        # Clear history
        await history_service.clear_history(user_id)
    
    except Exception as e:
        logger.error(f"Error clearing history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing history: {str(e)}",
        )

@router.get("/search/{query}", response_model=HistoryResponse)
async def search_history(
    query: str = Path(..., title="Search query"),
    user_id: CurrentUser = None,
    history_service: HistoryService = None,
) -> HistoryResponse:
    """
    Search history entries by text
    
    Args:
        query: Search query
        user_id: Current user ID
        history_service: History service
    
    Returns:
        List of matching history entries
    """
    try:
        logger.info(f"Searching history for user {user_id} with query '{query}'")
        
        # Search history
        entries = await history_service.search_history(user_id, query)
        
        return HistoryResponse(history=entries)
    
    except Exception as e:
        logger.error(f"Error searching history with query '{query}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching history: {str(e)}",
        )
