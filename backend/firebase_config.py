import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from typing import Dict, List, Any, Optional

# Path to the Firebase service account key file
# This should be set in a more secure way in production
SERVICE_ACCOUNT_KEY_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH", 
    "../shared/prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-27add91439.json"
)

class FirebaseManager:
    """
    Manager class for Firebase operations.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize_firebase()
            self._initialized = True
    
    def _initialize_firebase(self):
        """
        Initialize Firebase Admin SDK.
        """
        try:
            # Check if the service account key file exists
            if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
                cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                print("Firebase initialized successfully with service account key.")
            else:
                # For development, we can use a dummy implementation
                print("Firebase service account key not found. Using dummy implementation.")
                self.app = None
                self.db = None
        except Exception as e:
            print(f"Error initializing Firebase: {str(e)}")
            self.app = None
            self.db = None
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a Firebase ID token.
        
        Args:
            token: The Firebase ID token to verify.
            
        Returns:
            The decoded token claims.
            
        Raises:
            ValueError: If the token is invalid.
        """
        if not self.app:
            # For development, return a dummy user
            return {"uid": "dummy-user-id", "email": "dummy@example.com"}
        
        try:
            return auth.verify_id_token(token)
        except Exception as e:
            raise ValueError(f"Invalid token: {str(e)}")
    
    def get_user_prompt_templates(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all prompt templates for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of prompt templates.
        """
        if not self.db:
            # Return dummy data for development
            return [
                {
                    "id": "1",
                    "title": "Explain a Concept",
                    "content": "Explain [concept] in simple terms as if I'm a beginner. Include examples and analogies.",
                    "category": "Learning",
                    "userId": user_id,
                },
                {
                    "id": "2",
                    "title": "Code Review",
                    "content": "Review this code for bugs, performance issues, and best practices:\n\n```\n[code]\n```",
                    "category": "Programming",
                    "userId": user_id,
                },
            ]
        
        try:
            templates_ref = self.db.collection("promptTemplates").where("userId", "==", user_id)
            templates = []
            
            for doc in templates_ref.stream():
                template_data = doc.to_dict()
                template_data["id"] = doc.id
                templates.append(template_data)
            
            return templates
        except Exception as e:
            print(f"Error getting prompt templates: {str(e)}")
            return []
    
    def create_prompt_template(self, template_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new prompt template.
        
        Args:
            template_data: The template data.
            
        Returns:
            The created template with ID, or None if creation failed.
        """
        if not self.db:
            # Return dummy data for development
            template_data["id"] = "new-template-id"
            return template_data
        
        try:
            # Add timestamp
            template_data["createdAt"] = firestore.SERVER_TIMESTAMP
            template_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Add to Firestore
            template_ref = self.db.collection("promptTemplates").document()
            template_ref.set(template_data)
            
            # Get the created template
            created_template = template_ref.get().to_dict()
            created_template["id"] = template_ref.id
            
            return created_template
        except Exception as e:
            print(f"Error creating prompt template: {str(e)}")
            return None
    
    def update_prompt_template(self, template_id: str, template_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing prompt template.
        
        Args:
            template_id: The template ID.
            template_data: The template data to update.
            
        Returns:
            The updated template, or None if update failed.
        """
        if not self.db:
            # Return dummy data for development
            template_data["id"] = template_id
            return template_data
        
        try:
            # Add timestamp
            template_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Update in Firestore
            template_ref = self.db.collection("promptTemplates").document(template_id)
            template_ref.update(template_data)
            
            # Get the updated template
            updated_template = template_ref.get().to_dict()
            updated_template["id"] = template_id
            
            return updated_template
        except Exception as e:
            print(f"Error updating prompt template: {str(e)}")
            return None
    
    def delete_prompt_template(self, template_id: str) -> bool:
        """
        Delete a prompt template.
        
        Args:
            template_id: The template ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        if not self.db:
            # Return success for development
            return True
        
        try:
            # Delete from Firestore
            self.db.collection("promptTemplates").document(template_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting prompt template: {str(e)}")
            return False

# Create a singleton instance
firebase_manager = FirebaseManager()
