from fastapi import APIRouter, HTTPException, Depends

from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import create_access_token, get_current_user

import os
import httpx

router = APIRouter()
print("Users router loaded")

@router.get("/users/me", response_model=schemas.UserMeResponse)
def read_users_me(current_user: models.Users = Depends(get_current_user)):
    return current_user



GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"

@router.post("/users/google-login", response_model=schemas.TokenResponse)
def google_login(payload: schemas.GoogleLoginRequest):
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    if not google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not set")

    try:
        response = httpx.get(
            GOOGLE_TOKENINFO_URL,
            params={"access_token": payload.access_token},
            timeout=10,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Could not reach Google")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    token_info = response.json()

    if token_info.get("aud") != google_client_id:
        raise HTTPException(status_code=401, detail="Token was not issued for Trackly")

    email = token_info.get("email")

    if not email or token_info.get("email_verified") not in ("true", True):
        raise HTTPException(status_code=401, detail="Google account has no verified email")

    db = SessionLocal()
    try:
        user = db.query(models.Users).filter(models.Users.email == email).first()

        if not user:
            user = models.Users(email=email, google_id=token_info.get("sub"))
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            user.google_id = token_info.get("sub")
            db.commit()

        token = create_access_token({"user_id": user.id})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        db.close()
