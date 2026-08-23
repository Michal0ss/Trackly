from fastapi import APIRouter, HTTPException, Depends

from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import create_access_token, get_current_user
from sqlalchemy import func

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
    google_id = token_info.get("sub")

    if not email or token_info.get("email_verified") not in ("true", True):
        raise HTTPException(status_code=401, detail="Google account has no verified email")

    if not google_id:
        raise HTTPException(status_code=401, detail="Google token has no subject")

    normalized_email = email.strip().lower()

    db = SessionLocal()
    try:
        user = db.query(models.Users).filter(models.Users.google_id == google_id).first()

        if not user:
            user = (
                db.query(models.Users)
                .filter(func.lower(models.Users.email) == normalized_email)
                .first()
            )

            if user and user.google_id and user.google_id != google_id:
                raise HTTPException(
                    status_code=401,
                    detail="Google account does not match the existing Trackly account",
                )

        if not user:
            user = models.Users(email=normalized_email, google_id=google_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            user.google_id = google_id
            db.commit()

        token = create_access_token({"user_id": user.id})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        db.close()
