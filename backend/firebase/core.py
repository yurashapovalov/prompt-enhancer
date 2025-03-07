import firebase_admin
from firebase_admin import credentials, firestore
import os
import logging

# Logging setup
logger = logging.getLogger(__name__)

# Path to the Firebase service account key file
SERVICE_ACCOUNT_KEY_PATH = os.environ.get(
    "FIREBASE_SERVICE_ACCOUNT_KEY_PATH", 
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json")
)

class FirebaseCore:
    """
    Core class for Firebase initialization and management.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseCore, cls).__new__(cls)
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
                logger.info("Firebase initialized successfully with existing app.")
                return
            except ValueError:
                logger.info("Firebase app doesn't exist yet, initializing new app.")
            
            # Check if the service account key file exists
            if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
                logger.info(f"Service account key file found at: {SERVICE_ACCOUNT_KEY_PATH}")
                cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase initialized successfully with service account key.")
            else:
                logger.error(f"Service account key file NOT found at: {SERVICE_ACCOUNT_KEY_PATH}")
                self.app = None
                self.db = None
        except Exception as e:
            logger.error(f"Error initializing Firebase: {str(e)}")
            
            # Try to get existing app if initialization failed
            try:
                self.app = firebase_admin.get_app()
                logger.info("Using existing Firebase app after initialization error.")
                self.db = firestore.client()
            except ValueError:
                # No existing app, set to None
                self.app = None
                self.db = None

# Create a singleton instance
firebase_core = FirebaseCore()
