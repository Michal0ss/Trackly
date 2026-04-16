from fastapi import APIRouter, HTTPException
from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import hash_password

router = APIRouter()
print("Users router loaded")


@router.post("/users/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate):
    db = SessionLocal()

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