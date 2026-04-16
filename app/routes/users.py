from fastapi import APIRouter, HTTPException
from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter()
print("Users router loaded")


@router.post("/users/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate):
    db = SessionLocal()
    try:
        existing_user = db.query(models.Users).filter(models.Users.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        hashed_password = hash_password(user.password)

        new_user = models.Users(
            email = user.email,
            password = hashed_password
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    finally:
        db.close()

@router.post("/users/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin):
    db = SessionLocal()
    try:
        db_users = db.query(models.Users).filter(models.Users.email == user.email).first()

        if not db_users or not db_users.password:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        if not verify_password(user.password, db_users.password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        token = create_access_token({"user_id": db_users.id})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        db.close()
