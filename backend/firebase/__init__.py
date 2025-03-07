import logging

# Logging setup
logging.basicConfig(level=logging.INFO)

from .core import firebase_core
from .auth import verify_token
from .repositories import prompts_repository, variables_repository, history_repository

# Create a wrapper class for backward compatibility
class FirebaseManager:
    """
    Wrapper class for backward compatibility with existing code.
    """
    def __init__(self):
        self.app = firebase_core.app
        self.db = firebase_core.db
    
    # Auth methods
    def verify_token(self, token):
        return verify_token(token)
    
    # Prompts methods
    def get_user_prompts(self, user_id):
        return prompts_repository.get_user_prompts(user_id)
    
    def get_prompt(self, prompt_id, user_id):
        return prompts_repository.get_prompt(prompt_id, user_id)
    
    def create_prompt(self, prompt_data):
        return prompts_repository.create_prompt(prompt_data)
    
    def update_prompt(self, prompt_id, prompt_data, user_id):
        return prompts_repository.update_prompt(prompt_id, prompt_data, user_id)
    
    def delete_prompt(self, prompt_id, user_id):
        return prompts_repository.delete_prompt(prompt_id, user_id)
    
    # Variables methods
    def get_user_variables(self, user_id):
        return variables_repository.get_user_variables(user_id)
    
    def get_variable(self, variable_id, user_id):
        return variables_repository.get_variable(variable_id, user_id)
    
    def create_variable(self, variable_data):
        return variables_repository.create_variable(variable_data)
    
    def update_variable(self, variable_id, variable_data, user_id):
        return variables_repository.update_variable(variable_id, variable_data, user_id)
    
    def delete_variable(self, variable_id, user_id):
        return variables_repository.delete_variable(variable_id, user_id)
    
    # History methods
    def get_user_history(self, user_id, limit=None, offset=None):
        # Parameters limit and offset are ignored as we simplified the query
        return history_repository.get_user_history(user_id)
    
    def add_history_entry(self, entry_data):
        return history_repository.add_history_entry(entry_data)
    
    def delete_history_entry(self, entry_id, user_id):
        return history_repository.delete_history_entry(entry_id, user_id)
    
    def clear_user_history(self, user_id):
        return history_repository.clear_user_history(user_id)
    
    # Prompt templates methods (kept for backward compatibility)
    def get_user_prompt_templates(self, user_id):
        # This method is not used in the new version, but kept for compatibility
        return []
    
    def create_prompt_template(self, template_data):
        # This method is not used in the new version, but kept for compatibility
        return None
    
    def update_prompt_template(self, template_id, template_data):
        # This method is not used in the new version, but kept for compatibility
        return None
    
    def delete_prompt_template(self, template_id):
        # This method is not used in the new version, but kept for compatibility
        return False

# Create a singleton instance for backward compatibility
firebase_manager = FirebaseManager()
