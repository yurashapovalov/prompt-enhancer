from fastapi import Depends, HTTPException, status, Header
from backend.firebase import firebase_manager

async def get_current_user(authorization: str = Header(None)):
    print(f"Authorization header: {authorization[:20]}..." if authorization else "None")
    
    if not authorization:
        print("Authorization header is missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check the Authorization header format
    if not authorization.startswith("Bearer "):
        print("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication format. Use Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    print(f"Extracted token: {token[:10]}...")
    
    try:
        # Verify the Firebase token using FirebaseManager
        print("Verifying token with FirebaseManager...")
        decoded_token = firebase_manager.verify_token(token)
        uid = decoded_token["uid"]
        print(f"Token verified successfully. User ID: {uid}")
        return uid
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
