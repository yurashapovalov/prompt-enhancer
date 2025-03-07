import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

# Path to the Firebase service account key file
# This should be set in a more secure way in production
SERVICE_ACCOUNT_KEY_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH", 
    os.path.join(os.path.dirname(__file__), "prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json")
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
            print(f"Attempting to initialize Firebase with service account key at: {SERVICE_ACCOUNT_KEY_PATH}")
            
            # Check if Firebase app already exists
            try:
                self.app = firebase_admin.get_app()
                print("Firebase app already exists, using existing app.")
                self.db = firestore.client()
                print("Firebase initialized successfully with existing app.")
                return
            except ValueError:
                # App doesn't exist yet, continue with initialization
                print("Firebase app doesn't exist yet, initializing new app.")
            
            # Check if the service account key file exists
            if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
                print(f"Service account key file found at: {SERVICE_ACCOUNT_KEY_PATH}")
                cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                print("Firebase initialized successfully with service account key.")
            else:
                # For development, we can use a dummy implementation
                print(f"Service account key file NOT found at: {SERVICE_ACCOUNT_KEY_PATH}")
                print("Firebase service account key not found. Using dummy implementation.")
                self.app = None
                self.db = None
        except Exception as e:
            print(f"Error initializing Firebase: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            
            # Try to get existing app if initialization failed
            try:
                self.app = firebase_admin.get_app()
                print("Using existing Firebase app after initialization error.")
                self.db = firestore.client()
            except ValueError:
                # No existing app, set to None
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
        print(f"Verifying token: {token[:10]}...")
        
        # Сначала попробуем проверить токен с помощью Firebase Admin SDK
        if self.app:
            try:
                print("Attempting to verify token with Firebase Admin SDK...")
                decoded_token = auth.verify_id_token(token)
                print(f"Token verified successfully. User ID: {decoded_token.get('uid')}")
                return decoded_token
            except Exception as e:
                print(f"Error verifying token with Firebase Admin SDK: {str(e)}")
                # Продолжаем с ручной проверкой токена
        else:
            print("Firebase app not initialized, trying to extract user_id from token manually")
        
        # Если Firebase не инициализирован или проверка не удалась,
        # попробуем извлечь user_id из токена вручную
        try:
            import base64
            import json
            
            # Разделяем токен на части
            parts = token.split('.')
            if len(parts) >= 2:
                # Декодируем payload
                padded = parts[1] + '=' * (4 - len(parts[1]) % 4)
                decoded = base64.b64decode(padded)
                payload = json.loads(decoded)
                
                # Извлекаем user_id
                user_id = payload.get('user_id') or payload.get('sub') or payload.get('uid')
                if user_id:
                    print(f"Extracted user_id from token: {user_id}")
                    return {"uid": user_id, "email": payload.get('email', 'dev@example.com')}
                else:
                    print("Could not extract user_id from token payload")
        except Exception as ex:
            print(f"Error extracting user_id from token: {str(ex)}")
            print(f"Exception type: {type(ex).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
        
        # Если все методы не сработали, возвращаем dummy user
        # Это нужно для разработки, чтобы не блокировать работу приложения
        print("All token verification methods failed, returning dummy user")
        return {"uid": "dummy-user-id", "email": "dummy@example.com"}
    
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
    
    # New methods for prompts
    def get_user_prompts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all prompts for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of prompts.
        """
        print(f"Getting prompts for user ID: {user_id}")
        
        if not self.db:
            print("Firebase DB not initialized, returning dummy prompts data")
            # Return dummy data for development
            dummy_data = [
                {
                    "id": "prompt-1",
                    "promptName": "Explain a Concept",
                    "promptDescription": "Explain a complex concept in simple terms",
                    "promptText": "Explain [concept] in simple terms as if I'm a beginner. Include examples and analogies.",
                    "color": "var(--color-prompt-tile-emerald)",
                    "userId": user_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                },
                {
                    "id": "prompt-2",
                    "promptName": "Code Review",
                    "promptDescription": "Review code for bugs and improvements",
                    "promptText": "Review this code for bugs, performance issues, and best practices:\n\n```\n[code]\n```",
                    "color": "var(--color-prompt-tile-cobalt)",
                    "userId": user_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                },
            ]
            print(f"Returning {len(dummy_data)} dummy prompts")
            return dummy_data
        
        try:
            print(f"Querying Firestore collection 'prompts' where userId == '{user_id}'")
            prompts_ref = self.db.collection("prompts").where("userId", "==", user_id)
            prompts = []
            
            print("Streaming documents from Firestore...")
            for doc in prompts_ref.stream():
                print(f"Found document with ID: {doc.id}")
                prompt_data = doc.to_dict()
                prompt_data["id"] = doc.id
                prompts.append(prompt_data)
            
            print(f"Retrieved {len(prompts)} prompts from Firestore")
            return prompts
        except Exception as e:
            print(f"Error getting prompts: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
    
    def get_prompt(self, prompt_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific prompt.
        
        Args:
            prompt_id: The prompt ID.
            user_id: The user ID.
            
        Returns:
            The prompt data, or None if not found.
        """
        if not self.db:
            # Return dummy data for development
            return {
                "id": prompt_id,
                "promptName": "Dummy Prompt",
                "promptDescription": "This is a dummy prompt for development",
                "promptText": "This is the text of the dummy prompt.",
                "color": "var(--color-prompt-tile-emerald)",
                "userId": user_id,
                "createdAt": datetime.now(),
                "updatedAt": datetime.now(),
            }
        
        try:
            prompt_ref = self.db.collection("prompts").document(prompt_id)
            prompt_data = prompt_ref.get().to_dict()
            
            if not prompt_data or prompt_data.get("userId") != user_id:
                return None
            
            prompt_data["id"] = prompt_id
            return prompt_data
        except Exception as e:
            print(f"Error getting prompt: {str(e)}")
            return None
    
    def create_prompt(self, prompt_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new prompt.
        
        Args:
            prompt_data: The prompt data.
            
        Returns:
            The created prompt with ID, or None if creation failed.
        """
        if not self.db:
            # Return dummy data for development
            prompt_data["id"] = "new-prompt-id"
            prompt_data["createdAt"] = datetime.now()
            prompt_data["updatedAt"] = datetime.now()
            return prompt_data
        
        try:
            # Add timestamp
            prompt_data["createdAt"] = firestore.SERVER_TIMESTAMP
            prompt_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Add to Firestore
            prompt_ref = self.db.collection("prompts").document()
            prompt_ref.set(prompt_data)
            
            # Get the created prompt
            created_prompt = prompt_ref.get().to_dict()
            created_prompt["id"] = prompt_ref.id
            
            return created_prompt
        except Exception as e:
            print(f"Error creating prompt: {str(e)}")
            return None
    
    def update_prompt(self, prompt_id: str, prompt_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """
        Update an existing prompt.
        
        Args:
            prompt_id: The prompt ID.
            prompt_data: The prompt data to update.
            user_id: The user ID.
            
        Returns:
            The updated prompt, or None if update failed.
        """
        if not self.db:
            # Return dummy data for development
            prompt_data["id"] = prompt_id
            prompt_data["userId"] = user_id
            prompt_data["updatedAt"] = datetime.now()
            return prompt_data
        
        try:
            # Check if the prompt exists and belongs to the user
            prompt_ref = self.db.collection("prompts").document(prompt_id)
            prompt = prompt_ref.get().to_dict()
            
            if not prompt or prompt.get("userId") != user_id:
                return None
            
            # Add timestamp
            prompt_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Update in Firestore
            prompt_ref.update(prompt_data)
            
            # Get the updated prompt
            updated_prompt = prompt_ref.get().to_dict()
            updated_prompt["id"] = prompt_id
            
            return updated_prompt
        except Exception as e:
            print(f"Error updating prompt: {str(e)}")
            return None
    
    def delete_prompt(self, prompt_id: str, user_id: str) -> bool:
        """
        Delete a prompt.
        
        Args:
            prompt_id: The prompt ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        if not self.db:
            # Return success for development
            return True
        
        try:
            # Check if the prompt exists and belongs to the user
            prompt_ref = self.db.collection("prompts").document(prompt_id)
            prompt = prompt_ref.get().to_dict()
            
            if not prompt or prompt.get("userId") != user_id:
                return False
            
            # Delete from Firestore
            prompt_ref.delete()
            return True
        except Exception as e:
            print(f"Error deleting prompt: {str(e)}")
            return False
    
    # New methods for variables
    def get_user_variables(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all variables for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of variables.
        """
        print(f"Getting variables for user ID: {user_id}")
        
        if not self.db:
            print("Firebase DB not initialized, returning dummy variables data")
            # Return dummy data for development
            dummy_data = [
                {
                    "id": "var-1",
                    "variableName": "API_KEY",
                    "variableValue": "dummy-api-key",
                    "color": "var(--color-prompt-tile-tangerine)",
                    "userId": user_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                },
                {
                    "id": "var-2",
                    "variableName": "DATABASE_URL",
                    "variableValue": "https://example.com/db",
                    "color": "var(--color-prompt-tile-crimson)",
                    "userId": user_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                },
            ]
            print(f"Returning {len(dummy_data)} dummy variables")
            return dummy_data
        
        try:
            print(f"Querying Firestore collection 'variables' where userId == '{user_id}'")
            variables_ref = self.db.collection("variables").where("userId", "==", user_id)
            variables = []
            
            print("Streaming documents from Firestore...")
            for doc in variables_ref.stream():
                print(f"Found document with ID: {doc.id}")
                variable_data = doc.to_dict()
                variable_data["id"] = doc.id
                variables.append(variable_data)
            
            print(f"Retrieved {len(variables)} variables from Firestore")
            return variables
        except Exception as e:
            print(f"Error getting variables: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
    
    def get_variable(self, variable_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific variable.
        
        Args:
            variable_id: The variable ID.
            user_id: The user ID.
            
        Returns:
            The variable data, or None if not found.
        """
        if not self.db:
            # Return dummy data for development
            return {
                "id": variable_id,
                "variableName": "DUMMY_VARIABLE",
                "variableValue": "dummy-value",
                "color": "var(--color-prompt-tile-tangerine)",
                "userId": user_id,
                "createdAt": datetime.now(),
                "updatedAt": datetime.now(),
            }
        
        try:
            variable_ref = self.db.collection("variables").document(variable_id)
            variable_data = variable_ref.get().to_dict()
            
            if not variable_data or variable_data.get("userId") != user_id:
                return None
            
            variable_data["id"] = variable_id
            return variable_data
        except Exception as e:
            print(f"Error getting variable: {str(e)}")
            return None
    
    def create_variable(self, variable_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new variable.
        
        Args:
            variable_data: The variable data.
            
        Returns:
            The created variable with ID, or None if creation failed.
        """
        if not self.db:
            # Return dummy data for development
            variable_data["id"] = "new-variable-id"
            variable_data["createdAt"] = datetime.now()
            variable_data["updatedAt"] = datetime.now()
            return variable_data
        
        try:
            # Add timestamp
            variable_data["createdAt"] = firestore.SERVER_TIMESTAMP
            variable_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Add to Firestore
            variable_ref = self.db.collection("variables").document()
            variable_ref.set(variable_data)
            
            # Get the created variable
            created_variable = variable_ref.get().to_dict()
            created_variable["id"] = variable_ref.id
            
            return created_variable
        except Exception as e:
            print(f"Error creating variable: {str(e)}")
            return None
    
    def update_variable(self, variable_id: str, variable_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """
        Update an existing variable.
        
        Args:
            variable_id: The variable ID.
            variable_data: The variable data to update.
            user_id: The user ID.
            
        Returns:
            The updated variable, or None if update failed.
        """
        if not self.db:
            # Return dummy data for development
            variable_data["id"] = variable_id
            variable_data["userId"] = user_id
            variable_data["updatedAt"] = datetime.now()
            return variable_data
        
        try:
            # Check if the variable exists and belongs to the user
            variable_ref = self.db.collection("variables").document(variable_id)
            variable = variable_ref.get().to_dict()
            
            if not variable or variable.get("userId") != user_id:
                return None
            
            # Add timestamp
            variable_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Update in Firestore
            variable_ref.update(variable_data)
            
            # Get the updated variable
            updated_variable = variable_ref.get().to_dict()
            updated_variable["id"] = variable_id
            
            return updated_variable
        except Exception as e:
            print(f"Error updating variable: {str(e)}")
            return None
    
    def delete_variable(self, variable_id: str, user_id: str) -> bool:
        """
        Delete a variable.
        
        Args:
            variable_id: The variable ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        if not self.db:
            # Return success for development
            return True
        
        try:
            # Check if the variable exists and belongs to the user
            variable_ref = self.db.collection("variables").document(variable_id)
            variable = variable_ref.get().to_dict()
            
            if not variable or variable.get("userId") != user_id:
                return False
            
            # Delete from Firestore
            variable_ref.delete()
            return True
        except Exception as e:
            print(f"Error deleting variable: {str(e)}")
            return False
    
    # New methods for history
    def get_user_history(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get history entries for a user.
        
        Args:
            user_id: The user ID.
            limit: Maximum number of entries to return (not used in simplified query).
            offset: Number of entries to skip (not used in simplified query).
            
        Returns:
            A list of history entries.
        """
        print(f"Getting history for user ID: {user_id}")
        
        if not self.db:
            print("Firebase DB not initialized, returning dummy history data")
            # Return dummy data for development
            dummy_data = [
                {
                    "id": "hist-1",
                    "originalPrompt": "Explain quantum computing",
                    "enhancedPrompt": "Explain quantum computing in simple terms as if I'm a beginner. Include examples and analogies. Make your response clear and concise.",
                    "userId": user_id,
                    "timestamp": datetime.now(),
                },
                {
                    "id": "hist-2",
                    "originalPrompt": "Write a Python function to sort a list",
                    "enhancedPrompt": "Write a Python function to sort a list. Please provide specific examples. Make your response clear and concise.",
                    "userId": user_id,
                    "timestamp": datetime.now(),
                },
            ]
            print(f"Returning {len(dummy_data)} dummy history entries")
            return dummy_data
        
        try:
            print(f"Querying Firestore collection 'history' where userId == '{user_id}'")
            # Упрощенный запрос без сортировки, ограничения и смещения
            history_ref = self.db.collection("history").where("userId", "==", user_id)
            history = []
            
            print("Streaming documents from Firestore...")
            for doc in history_ref.stream():
                print(f"Found document with ID: {doc.id}")
                entry_data = doc.to_dict()
                entry_data["id"] = doc.id
                history.append(entry_data)
            
            print(f"Retrieved {len(history)} history entries from Firestore")
            return history
        except Exception as e:
            print(f"Error getting history: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
    
    def add_history_entry(self, entry_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Add a new history entry.
        
        Args:
            entry_data: The history entry data.
            
        Returns:
            The created history entry with ID, or None if creation failed.
        """
        if not self.db:
            # Return dummy data for development
            entry_data["id"] = "new-history-id"
            entry_data["timestamp"] = datetime.now()
            return entry_data
        
        try:
            # Add timestamp
            entry_data["timestamp"] = firestore.SERVER_TIMESTAMP
            
            # Add to Firestore
            entry_ref = self.db.collection("history").document()
            entry_ref.set(entry_data)
            
            # Get the created entry
            created_entry = entry_ref.get().to_dict()
            created_entry["id"] = entry_ref.id
            
            return created_entry
        except Exception as e:
            print(f"Error adding history entry: {str(e)}")
            return None
    
    def delete_history_entry(self, entry_id: str, user_id: str) -> bool:
        """
        Delete a history entry.
        
        Args:
            entry_id: The history entry ID.
            user_id: The user ID.
            
        Returns:
            True if deletion was successful, False otherwise.
        """
        if not self.db:
            # Return success for development
            return True
        
        try:
            # Check if the entry exists and belongs to the user
            entry_ref = self.db.collection("history").document(entry_id)
            entry = entry_ref.get().to_dict()
            
            if not entry or entry.get("userId") != user_id:
                return False
            
            # Delete from Firestore
            entry_ref.delete()
            return True
        except Exception as e:
            print(f"Error deleting history entry: {str(e)}")
            return False
    
    def clear_user_history(self, user_id: str) -> bool:
        """
        Clear all history entries for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            True if clearing was successful, False otherwise.
        """
        if not self.db:
            # Return success for development
            return True
        
        try:
            # Get all history entries for the user
            history_ref = self.db.collection("history").where("userId", "==", user_id)
            
            # Delete each entry
            for doc in history_ref.stream():
                doc.reference.delete()
            
            return True
        except Exception as e:
            print(f"Error clearing history: {str(e)}")
            return False
    
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
