from typing import List, Dict, Any, Optional
import logging
from firebase_admin import firestore

from ..core import firebase_core

# Logging setup
logger = logging.getLogger(__name__)

class BaseRepository:
    """
    Base repository class for Firestore operations.
    """
    def __init__(self, collection_name: str):
        """
        Initialize the repository with a collection name.
        
        Args:
            collection_name: The name of the Firestore collection.
        """
        self.db = firebase_core.db
        self.collection_name = collection_name
    
    def get_collection(self):
        """
        Get the Firestore collection.
        
        Returns:
            The Firestore collection.
            
        Raises:
            ValueError: If Firebase is not initialized.
        """
        if not self.db:
            raise ValueError(f"Firebase not initialized, cannot access collection '{self.collection_name}'")
        return self.db.collection(self.collection_name)
    
    def get_all_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all documents for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of documents.
        """
        logger.info(f"Getting all documents from '{self.collection_name}' for user ID: {user_id}")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, returning empty list for '{self.collection_name}'")
            return []
        
        try:
            docs_ref = self.get_collection().where("userId", "==", user_id)
            result = []
            
            for doc in docs_ref.stream():
                doc_data = doc.to_dict()
                doc_data["id"] = doc.id
                result.append(doc_data)
            
            logger.info(f"Retrieved {len(result)} documents from '{self.collection_name}'")
            return result
        except Exception as e:
            logger.error(f"Error getting documents from '{self.collection_name}': {str(e)}")
            return []
    
    def get_by_id(self, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a document by ID.
        
        Args:
            doc_id: The document ID.
            user_id: The user ID.
            
        Returns:
            The document data, or None if not found.
        """
        logger.info(f"Getting document '{doc_id}' from '{self.collection_name}' for user ID: {user_id}")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, returning None for document '{doc_id}'")
            return None
        
        try:
            doc_ref = self.get_collection().document(doc_id)
            doc_data = doc_ref.get().to_dict()
            
            if not doc_data or doc_data.get("userId") != user_id:
                logger.warning(f"Document '{doc_id}' not found or doesn't belong to user '{user_id}'")
                return None
            
            doc_data["id"] = doc_id
            return doc_data
        except Exception as e:
            logger.error(f"Error getting document '{doc_id}' from '{self.collection_name}': {str(e)}")
            return None
    
    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new document.
        
        Args:
            data: The document data.
            
        Returns:
            The created document with ID, or None if creation failed.
        """
        logger.info(f"Creating new document in '{self.collection_name}'")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, cannot create document in '{self.collection_name}'")
            return None
        
        try:
            # Add timestamp
            data["createdAt"] = firestore.SERVER_TIMESTAMP
            data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Add to Firestore
            doc_ref = self.get_collection().document()
            doc_ref.set(data)
            
            # Get the created document
            created_doc = doc_ref.get().to_dict()
            created_doc["id"] = doc_ref.id
            
            logger.info(f"Document created successfully with ID: {doc_ref.id}")
            return created_doc
        except Exception as e:
            logger.error(f"Error creating document in '{self.collection_name}': {str(e)}")
            return None
    
    def update(self, doc_id: str, data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """
        Update an existing document.
        
        Args:
            doc_id: The document ID.
            data: The document data to update.
            user_id: The user ID.
            
        Returns:
            The updated document, or None if update failed.
        """
        logger.info(f"Updating document '{doc_id}' in '{self.collection_name}' for user ID: {user_id}")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, cannot update document '{doc_id}'")
            return None
        
        try:
            # Check if the document exists and belongs to the user
            doc_ref = self.get_collection().document(doc_id)
            doc = doc_ref.get().to_dict()
            
            if not doc or doc.get("userId") != user_id:
                logger.warning(f"Document '{doc_id}' not found or doesn't belong to user '{user_id}'")
                return None
            
            # Add timestamp
            data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Update in Firestore
            doc_ref.update(data)
            
            # Get the updated document
            updated_doc = doc_ref.get().to_dict()
            updated_doc["id"] = doc_id
            
            logger.info(f"Document '{doc_id}' updated successfully")
            return updated_doc
        except Exception as e:
            logger.error(f"Error updating document '{doc_id}' in '{self.collection_name}': {str(e)}")
            return None
    
    def delete(self, doc_id: str, user_id: str) -> bool:
        """
        Delete a document.
        
        Args:
            doc_id: The document ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        logger.info(f"Deleting document '{doc_id}' from '{self.collection_name}' for user ID: {user_id}")
        
        if not self.db:
            logger.warning(f"Firebase DB not initialized, cannot delete document '{doc_id}'")
            return False
        
        try:
            # Check if the document exists and belongs to the user
            doc_ref = self.get_collection().document(doc_id)
            doc = doc_ref.get().to_dict()
            
            if not doc or doc.get("userId") != user_id:
                logger.warning(f"Document '{doc_id}' not found or doesn't belong to user '{user_id}'")
                return False
            
            # Delete from Firestore
            doc_ref.delete()
            logger.info(f"Document '{doc_id}' deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting document '{doc_id}' from '{self.collection_name}': {str(e)}")
            return False
