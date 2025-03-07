#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, auth
import sys
import os

# Путь к файлу сервисного аккаунта
SERVICE_ACCOUNT_KEY_PATH = "../shared/prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-27add91439.json"

def get_user_id(email):
    """
    Получает ID пользователя по его email.
    
    Args:
        email: Email пользователя.
        
    Returns:
        ID пользователя или None, если пользователь не найден.
    """
    try:
        # Инициализация Firebase
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        app = firebase_admin.initialize_app(cred)
        
        # Получение пользователя по email
        user = auth.get_user_by_email(email)
        return user.uid
    except Exception as e:
        print(f"Error: {str(e)}")
        return None
    finally:
        # Удаление приложения Firebase
        if firebase_admin._apps:
            firebase_admin.delete_app(firebase_admin.get_app())

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python get_user_id.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    user_id = get_user_id(email)
    
    if user_id:
        print(f"\nUser ID for {email}: {user_id}")
        print("\nTo seed Firestore with test data, run:")
        print(f"python seed_firestore.py {user_id}")
    else:
        print(f"\nUser with email {email} not found.")
        print("Make sure the user exists in Firebase Authentication.")
