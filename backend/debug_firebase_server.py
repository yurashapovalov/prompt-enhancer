from fastapi import FastAPI
import uvicorn
import os
import sys
import traceback

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    try:
        print("Starting server...")
        print(f"Current working directory: {os.getcwd()}")
        print(f"FIREBASE_SERVICE_ACCOUNT_KEY_PATH: {os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_PATH', 'Not set')}")
        
        # Check if the service account key file exists
        service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_PATH', '../shared/prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-27add91439.json')
        print(f"Checking if service account file exists at: {service_account_path}")
        if os.path.exists(service_account_path):
            print(f"Service account file exists!")
        else:
            print(f"Service account file does not exist!")
        
        print("Importing firebase_config...")
        from firebase_config import firebase_manager
        print("firebase_config imported successfully!")
        
        print(f"Firebase app initialized: {firebase_manager.app is not None}")
        print(f"Firebase db initialized: {firebase_manager.db is not None}")
        
        print("Starting uvicorn server...")
        uvicorn.run(app, host="0.0.0.0", port=8003)
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc(file=sys.stdout)
