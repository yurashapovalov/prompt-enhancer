from typing import List, Dict, Any, Generic, TypeVar, Optional, Type
from datetime import datetime
from firebase_admin import firestore
from ..models.base import BaseDBModel
from ..config.firebase_config import get_firestore_client
import logging

# Logger for repository operations
logger = logging.getLogger("repository")

T = TypeVar('T', bound=BaseDBModel)

class BaseRepository(Generic[T]):
    """
    Base repository for Firestore operations
    """
    def __init__(self, collection_name: str, model_class: Type[T]):
        self.db = get_firestore_client()
        self.collection_name = collection_name
        self.model_class = model_class
    
    def _get_collection_ref(self, user_id: str) -> firestore.CollectionReference:
        """
        Get collection reference for the user
        """
        return self.db.collection('users').document(user_id).collection(self.collection_name)
    
    def _document_to_model(self, doc: firestore.DocumentSnapshot) -> T:
        """
        Convert Firestore document to model instance
        """
        data = doc.to_dict()
        if data:
            # Add document ID to data
            data['id'] = doc.id
            
            # Convert Firestore timestamps to datetime
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].datetime()
            if 'updated_at' in data and data['updated_at']:
                data['updated_at'] = data['updated_at'].datetime()
            
            # Create model instance
            return self.model_class(**data)
        return None
    
    def _model_to_document(self, model: T) -> Dict[str, Any]:
        """
        Convert model instance to Firestore document
        """
        # Convert model to dict
        data = model.dict(exclude={'id'})
        
        # Convert datetime to Firestore timestamp
        if 'created_at' in data and data['created_at']:
            data['created_at'] = firestore.SERVER_TIMESTAMP
        if 'updated_at' in data and data['updated_at']:
            data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        return data
    
    async def get_all(self, user_id: str, limit: int = 100, offset: int = 0) -> List[T]:
        """
        Get all documents for the user
        
        Args:
            user_id: User ID
            limit: Maximum number of documents to return
            offset: Number of documents to skip
        
        Returns:
            List of model instances
        """
        try:
            collection_ref = self._get_collection_ref(user_id)
            
            # Get documents with pagination
            query = collection_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
            
            # Apply offset and limit
            if offset > 0:
                query = query.offset(offset)
            query = query.limit(limit)
            
            # Execute query
            docs = query.stream()
            
            # Convert documents to models
            result = [self._document_to_model(doc) for doc in docs]
            
            logger.debug(f"Retrieved {len(result)} documents from {self.collection_name} for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error getting documents from {self.collection_name}: {str(e)}")
            raise
    
    async def get_by_id(self, user_id: str, doc_id: str) -> Optional[T]:
        """
        Get document by ID
        
        Args:
            user_id: User ID
            doc_id: Document ID
        
        Returns:
            Model instance or None if not found
        """
        try:
            doc_ref = self._get_collection_ref(user_id).document(doc_id)
            doc = doc_ref.get()
            
            if doc.exists:
                logger.debug(f"Retrieved document {doc_id} from {self.collection_name} for user {user_id}")
                return self._document_to_model(doc)
            else:
                logger.debug(f"Document {doc_id} not found in {self.collection_name} for user {user_id}")
                return None
        
        except Exception as e:
            logger.error(f"Error getting document {doc_id} from {self.collection_name}: {str(e)}")
            raise
    
    async def create(self, user_id: str, model: T) -> T:
        """
        Create a new document
        
        Args:
            user_id: User ID
            model: Model instance
        
        Returns:
            Created model instance with ID
        """
        try:
            # Set timestamps
            now = datetime.now()
            model.created_at = now
            model.updated_at = now
            
            # Convert model to document
            data = self._model_to_document(model)
            
            # Add document to collection
            collection_ref = self._get_collection_ref(user_id)
            doc_ref = collection_ref.document()
            doc_ref.set(data)
            
            # Set ID in model
            model.id = doc_ref.id
            
            logger.debug(f"Created document {doc_ref.id} in {self.collection_name} for user {user_id}")
            return model
        
        except Exception as e:
            logger.error(f"Error creating document in {self.collection_name}: {str(e)}")
            raise
    
    async def update(self, user_id: str, doc_id: str, model: T) -> T:
        """
        Update an existing document
        
        Args:
            user_id: User ID
            doc_id: Document ID
            model: Model instance
        
        Returns:
            Updated model instance
        """
        try:
            # Check if document exists
            doc_ref = self._get_collection_ref(user_id).document(doc_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.error(f"Document {doc_id} not found in {self.collection_name} for user {user_id}")
                raise ValueError(f"Document {doc_id} not found")
            
            # Set updated timestamp
            model.updated_at = datetime.now()
            
            # Convert model to document
            data = self._model_to_document(model)
            
            # Update document
            doc_ref.update(data)
            
            # Set ID in model
            model.id = doc_id
            
            logger.debug(f"Updated document {doc_id} in {self.collection_name} for user {user_id}")
            return model
        
        except Exception as e:
            logger.error(f"Error updating document {doc_id} in {self.collection_name}: {str(e)}")
            raise
    
    async def delete(self, user_id: str, doc_id: str) -> None:
        """
        Delete a document
        
        Args:
            user_id: User ID
            doc_id: Document ID
        """
        try:
            # Check if document exists
            doc_ref = self._get_collection_ref(user_id).document(doc_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.error(f"Document {doc_id} not found in {self.collection_name} for user {user_id}")
                raise ValueError(f"Document {doc_id} not found")
            
            # Delete document
            doc_ref.delete()
            
            logger.debug(f"Deleted document {doc_id} from {self.collection_name} for user {user_id}")
        
        except Exception as e:
            logger.error(f"Error deleting document {doc_id} from {self.collection_name}: {str(e)}")
            raise
    
    async def delete_all(self, user_id: str) -> None:
        """
        Delete all documents for the user
        
        Args:
            user_id: User ID
        """
        try:
            # Get all documents
            collection_ref = self._get_collection_ref(user_id)
            docs = collection_ref.stream()
            
            # Delete each document
            for doc in docs:
                doc.reference.delete()
            
            logger.debug(f"Deleted all documents from {self.collection_name} for user {user_id}")
        
        except Exception as e:
            logger.error(f"Error deleting all documents from {self.collection_name}: {str(e)}")
            raise
