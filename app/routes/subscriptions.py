from fastapi import APIRouter
from app.database.db import SessionLocal
from app.database import models, schemas

router = APIRouter()

@router.post("/subscriptions")
def create_subscription(sub: schemas.SubscriptionCreate):
    db = SessionLocal()

    new_sub = models.Subscription(**sub.model_dump())
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return new_sub


@router.get("/subscriptions")
def get_subscriptions():
    db = SessionLocal()
    return db.query(models.Subscription).all()