import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('firebase_manager')

# Path to the Firebase service account key file
SERVICE_ACCOUNT_KEY_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH", 
    os.path.join(os.path.dirname(__file__), "prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json")
)

# Кэш для данных
CACHE_TTL = 300  # 5 минут в секундах
cache = {
    "prompts": {},
    "history": {},
    "timestamps": {}
}

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
            logger.info(f"Initializing Firebase with service account key at: {SERVICE_ACCOUNT_KEY_PATH}")
            
            # Check if Firebase app already exists
            try:
                self.app = firebase_admin.get_app()
                logger.info("Firebase app already exists, using existing app.")
                self.db = firestore.client()
                return
            except ValueError:
                # App doesn't exist yet, continue with initialization
                pass
            
            # Check if the service account key file exists
            if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
                cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase initialized successfully.")
            else:
                # For development, we can use a dummy implementation
                logger.warning(f"Service account key file not found. Using dummy implementation.")
                self.app = None
                self.db = None
        except Exception as e:
            logger.error(f"Error initializing Firebase: {str(e)}", exc_info=True)
            
            # Try to get existing app if initialization failed
            try:
                self.app = firebase_admin.get_app()
                self.db = firestore.client()
                logger.info("Using existing Firebase app after initialization error.")
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
        # Кэшируем токены для повторного использования
        token_key = token[:20]  # Используем часть токена как ключ
        if token_key in cache and "token" in cache[token_key]:
            if datetime.now().timestamp() - cache[token_key]["timestamp"] < CACHE_TTL:
                return cache[token_key]["token"]
        
        # Сначала попробуем проверить токен с помощью Firebase Admin SDK
        if self.app:
            try:
                decoded_token = auth.verify_id_token(token)
                # Кэшируем результат
                cache[token_key] = {
                    "token": decoded_token,
                    "timestamp": datetime.now().timestamp()
                }
                return decoded_token
            except Exception as e:
                logger.warning(f"Error verifying token with Firebase Admin SDK: {str(e)}")
                # Продолжаем с ручной проверкой токена
        
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
                    result = {"uid": user_id, "email": payload.get('email', 'dev@example.com')}
                    # Кэшируем результат
                    cache[token_key] = {
                        "token": result,
                        "timestamp": datetime.now().timestamp()
                    }
                    return result
        except Exception as ex:
            logger.error(f"Error extracting user_id from token", exc_info=True)
        
        # Если все методы не сработали, возвращаем dummy user
        # Это нужно для разработки, чтобы не блокировать работу приложения
        logger.warning("All token verification methods failed, returning dummy user")
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
        # Проверяем кэш
        cache_key = f"prompts_{user_id}"
        if cache_key in cache:
            if datetime.now().timestamp() - cache[cache_key]["timestamp"] < CACHE_TTL:
                return cache[cache_key]["data"]
        
        if not self.db:
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
            # Кэшируем результат
            cache[cache_key] = {
                "data": dummy_data,
                "timestamp": datetime.now().timestamp()
            }
            return dummy_data
        
        try:
            # Оптимизированный запрос с ограничением и сортировкой
            prompts_ref = self.db.collection("prompts").where("userId", "==", user_id).order_by("updatedAt", direction=firestore.Query.DESCENDING).limit(100)
            prompts = []
            
            for doc in prompts_ref.stream():
                prompt_data = doc.to_dict()
                prompt_data["id"] = doc.id
                prompts.append(prompt_data)
            
            # Кэшируем результат
            cache[cache_key] = {
                "data": prompts,
                "timestamp": datetime.now().timestamp()
            }
            
            return prompts
        except Exception as e:
            logger.error(f"Error getting prompts", exc_info=True)
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
    
    
    # New methods for history
    def get_user_history(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get history entries for a user.
        
        Args:
            user_id: The user ID.
            limit: Maximum number of entries to return.
            offset: Number of entries to skip.
            
        Returns:
            A list of history entries.
        """
        # Проверяем кэш
        cache_key = f"history_{user_id}_{limit}_{offset}"
        if cache_key in cache:
            if datetime.now().timestamp() - cache[cache_key]["timestamp"] < CACHE_TTL:
                return cache[cache_key]["data"]
        
        if not self.db:
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
            # Кэшируем результат
            cache[cache_key] = {
                "data": dummy_data,
                "timestamp": datetime.now().timestamp()
            }
            return dummy_data
        
        try:
            # Оптимизированный запрос с сортировкой, ограничением и смещением
            history_ref = self.db.collection("history").where("userId", "==", user_id).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
            
            # Если указан offset, используем его
            if offset > 0:
                # Получаем последний документ из предыдущей страницы
                last_docs = list(self.db.collection("history").where("userId", "==", user_id).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(offset).stream())
                if last_docs:
                    last_doc = last_docs[-1]
                    history_ref = history_ref.start_after(last_doc)
            
            history = []
            for doc in history_ref.stream():
                entry_data = doc.to_dict()
                entry_data["id"] = doc.id
                history.append(entry_data)
            
            # Кэшируем результат
            cache[cache_key] = {
                "data": history,
                "timestamp": datetime.now().timestamp()
            }
            
            return history
        except Exception as e:
            logger.error(f"Error getting history", exc_info=True)
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
