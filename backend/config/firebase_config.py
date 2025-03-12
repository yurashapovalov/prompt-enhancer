import firebase_admin
from firebase_admin import credentials, firestore
import os
import logging
from .settings import settings

# Logging setup
logger = logging.getLogger("firebase_config")

# Path to the Firebase service account key file
SERVICE_ACCOUNT_KEY_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json")
)

# Firebase app instance
firebase_app = None
firestore_db = None

def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    """
    global firebase_app, firestore_db
    
    try:
        logger.info(f"Initializing Firebase with service account key at: {SERVICE_ACCOUNT_KEY_PATH}")

        # Check if Firebase app already exists
        try:
            firebase_app = firebase_admin.get_app()
            logger.info("Firebase app already exists, using existing app.")
            firestore_db = firestore.client()
            logger.info("Firebase initialized successfully with existing app.")
            return firebase_app
        except ValueError:
            logger.info("Firebase app doesn't exist yet, initializing new app.")

        # Check if the service account key file exists
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            logger.info(f"Service account key file found at: {SERVICE_ACCOUNT_KEY_PATH}")
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_app = firebase_admin.initialize_app(cred)
            firestore_db = firestore.client()
            logger.info("Firebase initialized successfully with service account key.")
        else:
            logger.warning(f"Service account key file NOT found at: {SERVICE_ACCOUNT_KEY_PATH}")
            logger.warning("Trying to initialize with application default credentials.")
            firebase_app = firebase_admin.initialize_app()
            firestore_db = firestore.client()
            logger.info("Firebase initialized successfully with application default credentials.")
        
        return firebase_app
    
    except Exception as e:
        logger.error(f"Error initializing Firebase: {str(e)}")
        
        # Try to get existing app if initialization failed
        try:
            firebase_app = firebase_admin.get_app()
            logger.info("Using existing Firebase app after initialization error.")
            firestore_db = firestore.client()
            return firebase_app
        except ValueError:
            # No existing app, set to None
            firebase_app = None
            firestore_db = None
            raise

def get_firestore_client():
    """
    Get Firestore client
    """
    global firestore_db
    
    # Ensure Firebase is initialized
    if not firebase_app:
        initialize_firebase()
    
    return firestore_db or firestore.client()
