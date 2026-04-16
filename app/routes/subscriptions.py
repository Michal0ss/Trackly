from fastapi import APIRouter
from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import hash_password

router = APIRouter()
print("Subscriptions router loaded")

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

@router.get("/subscriptions/{subscription_id}")
def get_subscriptions_by_id(subscription_id: int):
    db = SessionLocal()
    sub = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not sub:
        return {"error" : "Subscription not found"}
    return sub

@router.delete("/subscriptions/{subscription_id}")
def delete_subscription(subscription_id: int) -> dict[str, str]:
    db = SessionLocal()
    sub = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not sub:
        return {"error" : "Subscription not found"}
    db.delete(sub)
    db.commit()
    return {"message": "Subscription successfully deleted"}

@router.put("/subscriptions/{subscription_id}")
def update_subscription(subscription_id: int, updated: schemas.SubscriptionUpdate):
    db = SessionLocal()
    sub = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not sub:
        return {"error" : "Subscription not found"}

    for key, value in updated.model_dump().items():
        setattr(sub, key, value)

    db.commit()
    db.refresh(sub)
    return sub

