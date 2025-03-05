from fastapi import FastAPI
import uvicorn
import os
from firebase_config import firebase_manager

app = FastAPI()

@app.get("/")
async def root():
    # Check if Firebase is initialized
    if firebase_manager.app:
        return {"message": "Firebase initialized successfully"}
    else:
        return {"message": "Firebase not initialized", "service_account_path": os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "Not set")}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
